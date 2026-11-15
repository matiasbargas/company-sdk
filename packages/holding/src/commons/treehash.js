'use strict';

/**
 * commons/treehash.js — content addressing for commons items (Mario C10).
 *
 * An item is a file or a directory. Its files are listed by relative path (posix separators,
 * sorted by code unit), each file's bytes are LF-normalized (CRLF and lone CR become LF), and the
 * tree hash is
 *     "sha256:" + sha256( for each file in order: "<relpath>\0<sha256hex(normalized bytes)>\n" )
 * so a rename, an added/removed file or a content change all change the hash, while line endings
 * and file creation order do not. A single file hashes under its base name.
 *
 * Symlinks, sockets and other non-regular files are refused (COMMONS_FORBIDDEN): they could point
 * outside the item, and the commons must only ever carry plain content.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CommonsError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}
const fail = (code, message) => { throw new CommonsError(code, message); };

const HASH_RE = /^sha256:[0-9a-f]{64}$/;
const sha256Hex = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** CRLF and lone CR → LF, byte-wise (no text decoding, so no byte is reinterpreted). */
function normalizeLf(buf) {
  if (!buf.includes(0x0d)) return buf;
  const out = Buffer.alloc(buf.length);
  let j = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0d) { out[j++] = 0x0a; if (buf[i + 1] === 0x0a) i++; } else out[j++] = buf[i];
  }
  return out.subarray(0, j);
}

/**
 * List an item's files: [{ rel, abs, mode, content (LF-normalized Buffer) }], sorted by rel.
 * `root` may be a file (rel = its base name) or a directory (walked recursively).
 */
function collectFiles(root) {
  const top = fs.lstatSync(root);
  const files = [];
  const add = (abs, rel, st) => files.push({ rel, abs, mode: st.mode, content: normalizeLf(fs.readFileSync(abs)) });
  if (top.isSymbolicLink()) fail('COMMONS_FORBIDDEN', `${root} is a symlink; publish the real content`);
  if (top.isFile()) {
    add(root, path.basename(root), top);
  } else if (top.isDirectory()) {
    const walk = (dir, prefix) => {
      for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        const rel = prefix ? `${prefix}/${name}` : name;
        const st = fs.lstatSync(abs);
        if (st.isSymbolicLink()) fail('COMMONS_FORBIDDEN', `${rel} is a symlink (an item carries plain files only)`);
        if (st.isDirectory()) walk(abs, rel);
        else if (st.isFile()) add(abs, rel, st);
        else fail('COMMONS_FORBIDDEN', `${rel} is not a regular file`);
      }
    };
    walk(root, '');
  } else {
    fail('COMMONS_FORBIDDEN', `${root} is neither a file nor a directory`);
  }
  if (files.length === 0) fail('COMMONS_EMPTY', `${root} has no files`);
  files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  return files;
}

/** Tree hash of collected files (see the header). */
function treeHash(files) {
  const h = crypto.createHash('sha256');
  for (const f of files) h.update(`${f.rel}\0${sha256Hex(f.content)}\n`);
  return `sha256:${h.digest('hex')}`;
}

module.exports = { CommonsError, fail, HASH_RE, sha256Hex, normalizeLf, collectFiles, treeHash };
