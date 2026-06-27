import styles from './Input.module.css'

function Input({ label, error, id, variant, ...props }) {
  const isDark = variant === 'dark'
  return (
    <div className={`${styles.wrapper} ${isDark ? styles.dark : ''}`}>
      {label && (
        <label className={`${styles.label} ${isDark ? styles.labelDark : ''}`} htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${styles.input} ${isDark ? styles.inputDark : ''} ${error ? styles.hasError : ''}`}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  )
}

export default Input