import { Link, type LinkComponentProps } from "@tanstack/react-router"
import { Button, type ButtonProps } from "./button"

type ButtonLinkProps = LinkComponentProps & Pick<ButtonProps, "variant" | "size">

const ButtonLink = (props: ButtonLinkProps) => (
  <Button variant={props.variant} size={props.size} asChild>
    <Link {...props} />
  </Button>
)
Button.displayName = "ButtonLink"

export { ButtonLink }
