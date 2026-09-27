import path from 'node:path';

export function resolvePublicPath(root, pathname, localAsset = null, exists = candidate => false) {
  if (localAsset) return { file: localAsset };
  const base = path.resolve(root);
  let file = path.resolve(base, `.${pathname}`);
  if (!file.startsWith(base + path.sep) && file !== base) return { status: 403 };
  if (!path.extname(pathname)) {
    const nestedIndex = path.join(file, 'index.html');
    file = pathname !== '/' && exists(nestedIndex) ? nestedIndex : path.join(base, 'index.html');
  }
  return { file };
}
