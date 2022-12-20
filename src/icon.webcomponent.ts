import debounce from 'lodash.debounce'
import { WebcomponentRenderer, IRenderingEngine } from '@enhanced-dom/webcomponent'
import type { IAbstractElement } from '@enhanced-dom/dom'
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

const iconInterpreters: Record<string, IIconInterpreter> = {}
const addInterpreter = (key: string, interpreter: IIconInterpreter) => {
  iconInterpreters[key] = interpreter
}

export interface IconWebComponentAttributes {
  config: IIconConfig<any>
}

export class IconWebComponent extends HTMLElement {
  static get observedAttributes() {
    return ['config', 'title', 'class', 'style']
  }

  static tag = 'enhanced-dom-icon'
  static register = () => {
    if (!window.customElements.get(IconWebComponent.tag)) {
      window.customElements.define(IconWebComponent.tag, IconWebComponent)
    }
  }

  static template = <T extends IIconConfig<any>>({ config, ...rest }: { config: T } & any) => {
    if (!config) {
      return
    }

    if (!config.namespace) {
      throw `no namespace found on the icon config: ${JSON.stringify(config)}`
    }

    const interpreter = iconInterpreters[config.namespace]
    if (!interpreter) {
      throw `no icon renderer found for namespace: ${config.namespace}`
    }

    return interpreter.getIcon({ config: omit(config, 'namespace'), ...rest })
  }
  static renderer: IRenderingEngine = new WebcomponentRenderer('@enhanced-dom/IconWebComponent', IconWebComponent.template)
  static addIconInterpreter = (key: string, interpreter: IIconInterpreter) => {
    addInterpreter(key, interpreter)
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _attributes: Record<string, any> = { role: 'img', 'aria-hidden': false }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
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

  set config(value: Record<string, any> | string) {
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
