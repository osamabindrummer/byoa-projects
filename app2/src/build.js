#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { marked } = require('marked');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const contentDir = path.join(rootDir, 'content');
const publicDir = path.join(rootDir, 'public');
const templatesDir = path.join(rootDir, 'templates');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

marked.setOptions({
  mangle: false,
  headerIds: false,
});

async function cleanDist() {
  await fs.rm(distDir, { recursive: true, force: true });
  await ensureDir(distDir);
}

function parseFrontMatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== '---') {
    return { attributes: {}, body: raw };
  }

  let i = 1;
  const attributes = {};
  while (i < lines.length && lines[i] !== '---') {
    const line = lines[i].trim();
    if (line) {
      const [key, ...rest] = line.split(':');
      attributes[key.trim()] = rest.join(':').trim();
    }
    i += 1;
  }

  const body = lines.slice(i + 1).join('\n');
  return { attributes, body };
}

async function readTemplate(name) {
  const templatePath = path.join(templatesDir, `${name}.html`);
  return fs.readFile(templatePath, 'utf8');
}

function applyTemplate(template, values) {
  return template
    .replace(/{{title}}/g, values.title)
    .replace(/{{content}}/g, values.content)
    .replace(/{{base}}/g, values.base)
    .replace(/{{year}}/g, String(values.year));
}

function computeBaseHref(outputPath) {
  const relative = path.relative(path.dirname(outputPath), distDir);
  if (!relative || relative === '') {
    return '.';
  }
  return relative;
}

function formatDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function makeExcerpt(rawBody, length = 160) {
  const stripped = rawBody
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_]/g, '')
    .replace(/#+\s?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length > length ? `${stripped.slice(0, length)}…` : stripped;
}

async function copyDirectory(source, target) {
  await ensureDir(target);
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function buildPages(baseTemplate) {
  const pagesDir = path.join(contentDir, 'pages');
  const entries = await fs.readdir(pagesDir);
  const outputs = [];

  for (const entry of entries) {
    if (!entry.endsWith('.md')) {
      continue;
    }
    const filePath = path.join(pagesDir, entry);
    const raw = await fs.readFile(filePath, 'utf8');
    const { attributes, body } = parseFrontMatter(raw);
    const htmlContent = marked.parse(body);
    const name = path.basename(entry, '.md');
    const outputName = name === 'index' ? 'index.html' : `${name}.html`;
    const outputPath = path.join(distDir, outputName);
    const base = computeBaseHref(outputPath);
    const rendered = applyTemplate(baseTemplate, {
      title: attributes.title || 'Página sin título',
      content: htmlContent,
      base,
      year: new Date().getFullYear(),
    });
    await fs.writeFile(outputPath, rendered, 'utf8');
    outputs.push({ attributes, body, outputPath });
  }
  return outputs;
}

async function buildPosts(baseTemplate) {
  const postsDir = path.join(contentDir, 'blog');
  const entries = await fs.readdir(postsDir);
  const outputs = [];

  for (const entry of entries) {
    if (!entry.endsWith('.md')) {
      continue;
    }
    const filePath = path.join(postsDir, entry);
    const raw = await fs.readFile(filePath, 'utf8');
    const { attributes, body } = parseFrontMatter(raw);
    const mdHtml = marked.parse(body);
    const slug = path.basename(entry, '.md');
    const outputDir = path.join(distDir, 'blog');
    await ensureDir(outputDir);
    const outputPath = path.join(outputDir, `${slug}.html`);
    const base = computeBaseHref(outputPath);
    const postContent = [
      '<article class="post">',
      '<header class="post-header">',
      `<h1>${attributes.title || 'Entrada sin título'}</h1>`,
      attributes.date ? `<p class="post-meta">${formatDate(attributes.date)}</p>` : '',
      '</header>',
      mdHtml,
      '</article>',
      '<section class="subscribe-callout">',
      '<h2>Suscríbete</h2>',
      '<p>Únete a la lista de correo y recibe novedades en tu bandeja.</p>',
      '<form class="subscribe-form" action="https://app.convertkit.com/forms/<tu-form-id>/subscriptions" method="post">',
      '<label for="email">Correo electrónico</label>',
      '<input type="email" id="email" name="email_address" required>',
      '<button type="submit">Quiero suscribirme</button>',
      '</form>',
      '</section>',
    ].join('\n');

    const rendered = applyTemplate(baseTemplate, {
      title: attributes.title || 'Entrada sin título',
      content: postContent,
      base,
      year: new Date().getFullYear(),
    });
    await fs.writeFile(outputPath, rendered, 'utf8');
    outputs.push({
      attributes,
      body,
      slug,
      outputPath,
    });
  }

  return outputs.sort((a, b) => {
    const aDate = new Date(a.attributes.date || 0).getTime();
    const bDate = new Date(b.attributes.date || 0).getTime();
    return bDate - aDate;
  });
}

async function buildBlogIndex(baseTemplate, posts) {
  const outputDir = path.join(distDir, 'blog');
  await ensureDir(outputDir);
  const listItems = posts
    .map((post) => {
      const dateLabel = post.attributes.date ? `<span class="post-date">${formatDate(post.attributes.date)}</span>` : '';
      const excerpt = makeExcerpt(post.body);
      return [
        '<li class="post-list-item">',
        `<a href="${post.slug}.html">${post.attributes.title || 'Entrada sin título'}</a>`,
        dateLabel,
        excerpt ? `<p class="post-excerpt">${excerpt}</p>` : '',
        '</li>',
      ].join('\n');
    })
    .join('\n');

  const content = [
    '<section class="blog-intro">',
    '<h1>Blog</h1>',
    '<p>Historias, avances y notas del proyecto.</p>',
    '</section>',
    `<ul class="post-list">${listItems}</ul>`,
  ].join('\n');

  const outputPath = path.join(outputDir, 'index.html');
  const base = computeBaseHref(outputPath);
  const rendered = applyTemplate(baseTemplate, {
    title: 'Blog',
    content,
    base,
    year: new Date().getFullYear(),
  });
  await fs.writeFile(outputPath, rendered, 'utf8');
}

async function build() {
  const baseTemplate = await readTemplate('base');
  await cleanDist();
  await copyDirectory(publicDir, distDir);
  await buildPages(baseTemplate);
  const posts = await buildPosts(baseTemplate);
  await buildBlogIndex(baseTemplate, posts);
  // eslint-disable-next-line no-console
  console.log('Sitio generado en', distDir);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
