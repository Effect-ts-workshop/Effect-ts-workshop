import type * as Preset from "@docusaurus/preset-classic"
import type { Config } from "@docusaurus/types"
import { themes as prismThemes } from "prism-react-renderer"

const config: Config = {
  title: "Effect-TS Workshop Companion",
  tagline: "Maîtrise Effect-TS par la pratique",
  favicon: "img/favicon.png",

  url: "https://effect-ts-workshop.github.io",
  trailingSlash: true,
  baseUrl: "/Effect-ts-workshop/",

  organizationName: "Effect-ts-workshop",
  projectName: "Effect-ts-workshop",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "fr",
    locales: ["fr"]
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/"
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css"
        }
      } satisfies Preset.Options
    ]
  ],

  themeConfig: {
    navbar: {
      title: "Effect-TS Workshop",
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Workshop"
        },
        {
          href: "https://github.com/Effect-ts-workshop/Effect-ts-workshop",
          label: "GitHub",
          position: "right"
        }
      ]
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Effect.ts",
              href: "https://effect.website/"
            }
          ]
        },
        {
          title: "Community",
          items: [
            {
              label: "Blog",
              href: "https://effect.website/blog"
            },
            {
              label: "Discord",
              href: "https://discord.com/invite/effect-ts"
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} - Effect Devoxx workshop`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["typescript"]
    }
  } satisfies Preset.ThemeConfig
}

export default config
