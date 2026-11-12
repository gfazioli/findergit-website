import classes from './FooterWordmark.module.css';

/**
 * The footer's last word: the name, as wide as the content, fading into the
 * floor. Decorative, so hidden from assistive tech: the footer already names
 * the site in its own text. The design is in the stylesheet's header.
 */
export function FooterWordmark({ name }: { name: string }) {
  return (
    <div aria-hidden className={classes.mark}>
      <span className={classes.wordmark}>
        <span className={classes.name}>{name}</span>
        <span className={classes.period}>.</span>
        <span className={classes.glint}>
          <span className={classes.glintText} data-name={name} />
        </span>
      </span>
    </div>
  );
}
