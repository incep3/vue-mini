export function dump(node, indent = 0) {
  const type = node.type
  const desc =
    node.type === 'Root'
      ? ''
      : node.type === 'Element'
      ? node.tag
      : node.content

  console.log(`${'-'.repeat(indent)}${type}: ${desc}`)

  if (node.children) {
    node.children.forEach((child) => dump(child, indent + 2))
  }
}
