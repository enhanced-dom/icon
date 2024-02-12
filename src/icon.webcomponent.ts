import { type IAbstractElement } from '@enhanced-dom/dom'
import { WebcomponentRenderer, type IRenderingEngine } from '@enhanced-dom/webcomponent'
import debounce from 'lodash.debounce'
import omit from 'lodash.omit'

export interface IIconInterpreter<
  ConfigType = IIconConfig,
  IconPropsType extends {
    config: IIconConfig<ConfigType>
    title?: string
    delegated?: Record<string, string>
  } = {
    config: IIconConfig<ConfigType>
    title?: string
    delegated?: Record<string, string>
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

export interface IconWebComponentAttributes<IconImplementationType = any> {
  config: IIconConfig<IconImplementationType>
  title?: string
  delegated?: Record<string, string>
}

export class IconWebComponent extends HTMLElement {
  static get observedAttributes() {
    return ['config', 'title', 'delegated']
  }

  static tag = 'enhanced-dom-icon'
  static register = () => {
    if (!window.customElements.get(IconWebComponent.tag)) {
      window.customElements.define(IconWebComponent.tag, IconWebComponent)
    }
  }

  static template = <T extends IIconConfig<any>>({ config, delegated = {}, ...rest }: { config: T } & any) => {
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

    return interpreter.getIcon({ config: omit(config, 'namespace'), ...delegated, ...rest })
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

  get delegated() {
    return JSON.parse(this.getAttribute('delegated'))
  }

  set delegated(value: Record<string, any> | string) {
    const parsedValue = typeof value === 'string' ? JSON.parse(value) : value
    this._attributes.delegated = parsedValue
    this.setAttribute('delegated', JSON.stringify(parsedValue))
  }

  attributeChangedCallback(name: string, oldVal: string, newVal: string) {
    if (oldVal !== newVal) {
      switch (name) {
        case 'config':
          this.config = newVal
          break
        case 'delegated':
          this.delegated = newVal
          break
        default:
          this._attributes[name] = newVal
          break
      }
      this.render()
    }
  }
}
