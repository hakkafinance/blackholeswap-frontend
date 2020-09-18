import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect
} from 'react'
import { v4 as uuid } from 'uuid'
import SnackbarContainer from './SnackbarContainer'
import Snackbar from './Snackbar'

const SnackbarContext = createContext()

export function useSnackbarContext() {
  return useContext(SnackbarContext)
}

export default function SnackbarProvider(props) {
  const { children, duration = 15000 } = props

  const [alerts, setAlerts] = useState([])
  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => setAlerts((alerts) => alerts.slice(0, alerts.length - 1)), duration)
      return () => clearTimeout(timer)
    }
  }, [alerts, duration])

  // add alert
  const addAlert = useCallback(
    (alert) => setAlerts((alerts) => [alert, ...alerts]),
    [],
  )

  // TODO:
  // remove alert

  const value = useMemo(() => ({ addAlert }), [addAlert])
  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <SnackbarContainer>
        {alerts.map((alert, index) => (
          <Snackbar
            key={`${alert.key}`}
            variant={alert.variant}
          >
            {alert.message}
          </Snackbar>
        ))}
      </SnackbarContainer>
    </SnackbarContext.Provider>
  )
}

 export function useSnackbar() {
   const { addAlert } = useSnackbarContext()

   const enqueueSnackbar = useCallback((message, options) => {
     addAlert({
       key: uuid(),
       message,
       variant: options?.variant || 'error'
      })
   }, [addAlert])

  return { enqueueSnackbar }
 }
