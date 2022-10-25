import React from 'react'
import { faArrowAltCircleUp } from '@fortawesome/free-regular-svg-icons'

import { Icon } from './icon.component'
import * as styles from './app.pcss'

const App = () => {
  return (
    <div className={styles.container}>
      <Icon config={{ ...faArrowAltCircleUp, namespace: 'fa5' }} />
    </div>
  )
}

export default App
