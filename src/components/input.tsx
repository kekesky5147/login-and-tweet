'use client'

import {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ChangeEventHandler
} from 'react'

type InputElementProps = InputHTMLAttributes<HTMLInputElement> & {
  type?: 'text' | 'email' | 'password'
}

type TextareaElementProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  type: 'textarea'
}

type CommonProps = {
  name: string
  errors?: string[]
  className?: string
  placeholder?: string
  required?: boolean
  value?: string
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
  autoComplete?: string
}

type InputProps = CommonProps & (InputElementProps | TextareaElementProps)

export default function Input ({
  name,
  errors = [],
  className = '',
  type = 'text',
  ...rest
}: InputProps) {
  const baseStyles = `border rounded-md p-3 w-full text-lg ${
    errors.length > 0 ? 'border-red-500' : 'border-gray-300'
  } ${className}`

  return (
    <div className='flex flex-col gap-2'>
      {type === 'textarea' ? (
        <textarea
          name={name}
          className={`${baseStyles} resize-none`}
          placeholder={rest.placeholder}
          required={rest.required}
          value={rest.value}
          onChange={rest.onChange}
          autoComplete={rest.autoComplete}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          name={name}
          type={type}
          className={`${baseStyles} h-12`}
          placeholder={rest.placeholder}
          required={rest.required}
          value={rest.value}
          onChange={rest.onChange}
          autoComplete={rest.autoComplete}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {errors.map((error, index) => (
        <span key={index} className='text-red-500 text-sm'>
          {error}
        </span>
      ))}
    </div>
  )
}
