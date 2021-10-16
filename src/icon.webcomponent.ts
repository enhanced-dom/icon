import { IconDefinition } from '@fortawesome/fontawesome-common-types'
import debounce from 'lodash.debounce'
import { HtmlRenderer, IAbstractElement } from '@enhanced-dom/webcomponent'
import uniqueId from 'lodash.uniqueid'
import omit from 'lodash.omit'

export interface IIconInterpreter<
  ConfigType = IIconConfig,
  IconPropsType extends { config: IIconConfig<ConfigType>; title?: string; class?: string; style?: string } = {
    config: IIconConfig<ConfigType>
    title?: string
    class?: string
    style?: string
  },
> {
  getIcon: (props: IconPropsType) => IAbstractElement
}

export type IIconConfig<IconImplementationType = any> = IconImplementationType & {
  namespace: string
}

export class MultiIconRenderer {
  private static _iconInterpreters: Record<string, IIconInterpreter> = {}
  private static _styles: Record<string, string>
  static addInterpreter = (key: string, interpreter: IIconInterpreter) => {
    MultiIconRenderer._iconInterpreters[key] = interpreter
  }

  render = <T extends IIconConfig<any>>(node: ShadowRoot, { config, ...rest }: { config: T } & any) => {
    if (!config) {
      return
    }

    if (!config.namespace) {
      throw `no namespace found on the icon config: ${JSON.stringify(config)}`
    }

    const interpreter = MultiIconRenderer._iconInterpreters[config.namespace]
    if (!interpreter) {
      throw `no icon renderer found for namespace: ${config.namespace}`
    }

    const renderer = new HtmlRenderer(interpreter.getIcon)
    renderer.render(node, { config: omit(config, 'namespace'), ...rest })
  }

  addStyle = (name: string, style: string) => {
    MultiIconRenderer._styles[name] = style
  }
}

export interface IconWebComponentAttributes {
  config: IIconConfig<any>
}

export class IconWebComponent extends HTMLElement {
  static get observedAttributes() {
    return ['config', 'title', 'class', 'style']
  }

  static readonly renderer = new MultiIconRenderer()
  static addIconInterpreter = (key: string, interpreter: IIconInterpreter) => {
    MultiIconRenderer.addInterpreter(key, interpreter)
  }
  private _attributes: Record<string, any> = { role: 'img', titleId: uniqueId(`enhanced-dom-icon-`), 'aria-hidden': false }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    IconWebComponent.renderer.render(this.shadowRoot, this._attributes)
  }

  render = debounce(
    () => {
      IconWebComponent.renderer.render(this.shadowRoot, this._attributes)
    },
    10,
    { leading: false, trailing: true },
  )

  connectedCallback() {
    this.render()
  }

  get config() {
    return JSON.parse(this.getAttribute('config'))
  }

  set config(value: IconDefinition | string) {
    const parsedValue = typeof value === 'string' ? JSON.parse(value) : value
    this._attributes.config = parsedValue
    this.setAttribute('config', JSON.stringify(parsedValue))
  }

  attributeChangedCallback(name: string, oldVal: string, newVal: string) {
    if (oldVal !== newVal) {
      switch (name) {
        case 'config':
          this.config = newVal
          break
        default:
          this._attributes[name] = newVal
          break
      }
      this.render()
    }
  }
}

// IconWebComponent.renderer.addStyle('default', styles._source)
