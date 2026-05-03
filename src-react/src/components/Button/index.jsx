import styles from './Button.module.css'

// "variant" permite mudar o visual sem criar um componente novo
function Button({ children, variant = 'primary', isLoading, ...props }) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Carregando...' : children}
    </button>
  )
}

export default Button