/**
 * Material Symbols Outlined ligature wrapper.
 *
 * The design screens are authored against Google's icon font, so icons are
 * passed as ligature names (`name="analytics"`). `fill` toggles the FILL
 * axis, which the design uses for filled stars and selected states.
 */
export default function Icon({ name, size = 24, fill = false, weight = 400, className = '', style, ...rest }) {
  const variation = `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`

  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${fill ? 'icon-fill' : ''} ${className}`.trim()}
      style={{ fontSize: `${size}px`, fontVariationSettings: variation, ...style }}
      {...rest}
    >
      {name}
    </span>
  )
}