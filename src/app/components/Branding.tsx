/* eslint-disable @next/next/no-img-element */
import styles from './Branding.module.css';

export default function Branding() {
    return (
        <div className={styles.brandingCard}>
            <img
                src="/images/logo.png"
                alt="TubeMap Logo"
                className={styles.logoImage}
                style={{ height: '66px', width: 'auto' }}
            />
            <div>
                <h1 className={styles.title}>TubeMap</h1>
                <p className={styles.slogan}>내 주변 방송·유튜브 맛집, 한눈에</p>
            </div>
        </div>
    );
}
