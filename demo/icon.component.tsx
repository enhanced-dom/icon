import { withReactAdapter } from '@enhanced-dom/react'
import { FontawesomeIconRenderer } from '@enhanced-dom/fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

import { IconWebComponent, type IIconConfig } from '../src'

IconWebComponent.addIconInterpreter('fa5', new FontawesomeIconRenderer())

type IconConfigType = IIconConfig<IconDefinition>

declare interface IconAttributes
  extends Omit<React.DetailedHTMLProps<React.HTMLAttributes<IconWebComponent>, IconWebComponent>, 'class' | 'style'> {
  className?: string
  style?: React.CSSProperties
  config: IconConfigType
}

export const Icon = withReactAdapter<IconWebComponent, never[], typeof IconWebComponent, IconAttributes>({
  type: IconWebComponent,
})
