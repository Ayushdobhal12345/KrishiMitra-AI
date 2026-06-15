import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.icon}>🌾</div>
        <div>
          <div className={styles.title}>
            Krishi <span>Mitra</span>
          </div>
          <div className={styles.sub}>
            Mandakini Organic Produce Collective · Uttarakhand
          </div>
        </div>
        <div className={styles.badge}>
          <span className={styles.liveDot} />
          AI Advisory
        </div>
      </div>
      {/* Mountain silhouette strip */}
      <div className={styles.mountainStrip}>
        <svg viewBox="0 0 800 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <polygon
            points="0,40 80,10 160,28 280,5 380,22 500,8 620,25 720,12 800,20 800,40"
            fill="#f5f2eb"
          />
        </svg>
      </div>
    </header>
  )
}
