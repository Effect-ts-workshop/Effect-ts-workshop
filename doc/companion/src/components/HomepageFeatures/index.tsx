import clsx from "clsx"
import type { ReactNode } from "react"
import styles from "./styles.module.css"

type FeatureItem = {
  title: string
  pictureUrl: string
  logoUrl: ReactNode
  description: ReactNode
}

const FeatureList: Array<FeatureItem> = [
  {
    title: "Johan Rouve",
    pictureUrl: "https://iili.io/5LEXeV.jpg",
    logoUrl: (
      <img
        src="img/logo_dilitrust.svg"
        alt="DiliTrust logo"
        className={styles.logo_dilitrust}
      />
    ),
    description: <>Développeur full-stack chez DiliTrust</>
  },
  {
    title: "Marjorie Aubert",
    pictureUrl: "https://iili.io/3FFyGpa.md.jpg",
    logoUrl: (
      <img
        src="https://cdn.prod.website-files.com/642eed47b21be33868253a0c/642eee3534abb5bc1e1552ba_logo_yellow.svg"
        alt="Comet logo"
        className={styles.logo_comet}
      />
    ),
    description: <>Développeuse full-stack chez Comet Meetings</>
  },
  {
    title: "Bastien Tran",
    pictureUrl: "https://iili.io/3FKFlou.jpg",
    logoUrl: (
      <img
        src="https://cdn.prod.website-files.com/642eed47b21be33868253a0c/642eee3534abb5bc1e1552ba_logo_yellow.svg"
        alt="Comet logo"
        className={styles.logo_comet}
      />
    ),
    description: <>Développeur full-stack chez Comet Meetings</>
  }
]

function Feature({ description, logoUrl, pictureUrl, title }: FeatureItem) {
  return (
    <div className={clsx("col avatar avatar--vertical")}>
      <img
        src={pictureUrl}
        className={clsx(
          "avatar__photo avatar__photo--xl",
          styles.avatar__photo
        )}
      />
      <div
        className={clsx(
          "text--center margin-top--md padding-horiz--md avatar__intro",
          styles.avatar__intro
        )}
      >
        <div className="avatar__name">{title}</div>
        <p className="avatar__subtitle">{description}</p>
      </div>
      {logoUrl}
    </div>
  )
}

export default function HomepageFeatures(): ReactNode {
  return (
    <>
      <section className={styles.features}>
        <div className="container">
          <h3 className="text--center">Animé par</h3>
          <div className={clsx("row", styles.features_row_container)}>
            {FeatureList.map((props, idx) => <Feature key={idx} {...props} />)}
          </div>
        </div>
      </section>
    </>
  )
}
