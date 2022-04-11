import React from 'react'

interface buttonProps {
    clickHandler: () => void,
    title: string
    disabled?: boolean
}

export default function ExampleButton(props: buttonProps) {
  return (
    <button style={{ background: props.disabled? 'green' : '#783FE6', borderRadius: '6px', color: 'white', marginLeft: '15px' }} 
        onClick={props.clickHandler} disabled={props.disabled}>
            {props.title}
    </button>
  )
}
