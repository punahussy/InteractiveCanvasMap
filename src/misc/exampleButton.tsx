import React from 'react'

interface buttonProps {
    clickHandler: () => void,
    title: string
    disabled?: boolean
}

export default function ExampleButton(props: buttonProps) {
  return (
    <button style={{ background: props.disabled? 'green' : '#783FE6', padding: '10px',borderRadius: '6px', color: 'white', marginTop: '5px' }} 
        onClick={props.clickHandler} disabled={props.disabled}>
            <b>{props.title}</b>
    </button>
  )
}
