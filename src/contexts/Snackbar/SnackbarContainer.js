import React, { useRef } from 'react'
import { Transition, TransitionGroup } from 'react-transition-group'
import styled from 'styled-components'

const Container = styled.div`
  position: fixed;
  top: 88px;
  right: 24px;

  > *:not(:first-child) {
    margin-top: 16px;
  }

  ${({ theme }) => theme.mediaQuery.md`
    top: 100px;
    right: 40px;
    z-index: 80;
  `}
`

const defaultStyle = {
  transition: 'all 0.6s ease-in-out',
  opacity: 0,
  transform: 'translateX(200px)',
}

const transitionStyles = {
  entering: { opacity: 0, transform: 'translateX(200px)' },
  entered: { opacity: 1, transform: 'translateX(0)' },
  exiting: { opacity: 0, transform: 'translateX(200px)' },
  exited: { opacity: 0, transform: 'translateX(200px)' },
}

export default function SnackbarContainer(props) {
  const { children } = props

  const nodeRef = useRef()

  return (
    <Container>
      <TransitionGroup component={null}>
        {React.Children.map(children, (child, index) => (
          <Transition
            key={child.key}
            nodeRef={nodeRef}
            timeout={300}
          >
            {(state) =>
              React.cloneElement(child, {
                style: {
                  ...defaultStyle,
                  ...child.props.style,
                  ...transitionStyles[state],
                },
              })
            }
          </Transition>
        ))}
      </TransitionGroup>
    </Container>
  )
}
