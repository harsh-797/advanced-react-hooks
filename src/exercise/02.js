// function useAsync(asyncCallback, initialState, dependencies) {/* code in here */}
// useCallback: custom hooks
// http://localhost:3000/isolated/exercise/02.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'

function useSafeDispatch(dispatch) {
  const ref = React.useRef(false)
  React.useEffect(() => {
    ref.current = true
    return () => {
      ref.current = false
    }
  })
  return React.useCallback((...args) => {
    if (ref.current) dispatch(...args)
  }, [])
}

function pokemonInfoReducer(state, action) {
  switch (action.type) {
    case 'pending': {
      // 🐨 replace "pokemon" with "data"
      return {status: 'pending', data: null, error: null}
    }
    case 'resolved': {
      // 🐨 replace "pokemon" with "data" (in the action too!)
      return {status: 'resolved', data: action.data, error: null}
    }
    case 'rejected': {
      // 🐨 replace "pokemon" with "data"
      return {status: 'rejected', data: null, error: action.error}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function useAsync(defaultValue) {
  const [state, unsafeDispatch] = React.useReducer(pokemonInfoReducer, {
    status: 'idle',
    data: null,
    error: null,
    ...defaultValue,
  })
  const dispatch = useSafeDispatch(unsafeDispatch)

  const func = React.useCallback(
    function () {
      if (!arguments.length) return
      if (!arguments[0]) {
        return
      }
      dispatch({type: 'pending'})
      arguments[0].then(
        data => {
          dispatch({type: 'resolved', data})
        },
        error => {
          dispatch({type: 'rejected', error})
        },
      )
    },
    [dispatch],
  )
  return [state, func]
}

function PokemonInfo({pokemonName}) {
  const [state, func] = useAsync({
    status: 'idle',
  })
  const ref = React.useRef(null)
  const {data, status, error} = state
  React.useEffect(() => {
    if (!pokemonName) return
    ref.current = setTimeout(() => {
      const promise = fetchPokemon(pokemonName)
      func(promise)
    })
    return () => {
      clearTimeout(ref.current)
    }
  }, [func, pokemonName])

  switch (status) {
    case 'idle':
      return <span>Submit a pokemon</span>
    case 'pending':
      return <PokemonInfoFallback name={pokemonName} />
    case 'rejected':
      throw error
    case 'resolved':
      return <PokemonDataView pokemon={data} />
    default:
      throw new Error('This should be impossible')
  }
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className="pokemon-info">
        <PokemonErrorBoundary onReset={handleReset} resetKeys={[pokemonName]}>
          <PokemonInfo pokemonName={pokemonName} />
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}

function AppWithUnmountCheckbox() {
  const [mountApp, setMountApp] = React.useState(true)
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={mountApp}
          onChange={e => setMountApp(e.target.checked)}
        />{' '}
        Mount Component
      </label>
      <hr />
      {mountApp ? <App /> : null}
    </div>
  )
}

export default AppWithUnmountCheckbox
