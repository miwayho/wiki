marked.setOptions({
  breaks: true,
  highlight: function (code, lang) {
    return hljs.highlightAuto(code).value;
  }
});

const mdFiles = ['intro.md', 'guide.md', 'faq.md'];

async function loadMD(file) {
  try {
    const response = await fetch(`https://raw.githubusercontent.com/miwayho/wiki/main/docs/${file}`);
    if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
    const md = await response.text();
    const html = marked.parse(md);
    document.getElementById('content').innerHTML = html;
    document.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightElement(el);
    });
    generateTOC();
  } catch (err) {
    console.error("Ошибка загрузки файла:", err);
    document.getElementById('content').innerHTML = `
      <div class="alert alert-danger">
        Документ не найден: ${file}
      </div>
    `;
  }
}

function generateTOC() {
  const content = document.getElementById('content');
  const tocContainer = document.getElementById('toc');
  tocContainer.innerHTML = '<div class="section-title">Навигация</div>';
  const headings = content.querySelectorAll('h1, h2, h3');
  headings.forEach(heading => {
    if (!heading.id) {
      heading.id = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    }
    const level = parseInt(heading.tagName.substring(1));
    const tocItem = document.createElement('div');
    tocItem.className = 'toc-item';
    tocItem.style.marginLeft = (level - 1) * 10 + 'px';
    tocItem.textContent = heading.textContent;
    tocItem.addEventListener('click', () => {
      document.getElementById(heading.id).scrollIntoView({ behavior: 'smooth' });
    });
    tocContainer.appendChild(tocItem);
  });
}

document.querySelectorAll('.sub-item').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.sub-item').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    loadMD(this.dataset.md);
    if (window.innerWidth <= 768) {
      document.getElementById('fileMenu').classList.remove('open');
    }
  });
});

loadMD(document.querySelector('.sub-item.active').dataset.md);

async function searchDocuments(query) {
  const resultsContainer = document.getElementById('searchResults');
  resultsContainer.innerHTML = '';
  if (!query) return;
  query = query.toLowerCase();
  for (const file of mdFiles) {
    try {
      const response = await fetch(`https://raw.githubusercontent.com/miwayho/wiki/main/docs/${file}`);
      if (!response.ok) continue;
      const text = await response.text();
      const regex = new RegExp(`(.{0,50}(${query}).{0,50})`, 'gi');
      const matches = [...text.matchAll(regex)];
      if (matches.length > 0) {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
          <span class="result-filename">${file}</span>
          <span class="result-text">${matches[0][1].replace(new RegExp(query, 'gi'), match => `<mark>${match}</mark>`)}</span>
        `;
        resultItem.addEventListener('click', async () => {
          const activeLink = document.querySelector(`.sub-item[data-md="${file}"]`);
          if (activeLink) {
            activeLink.click();
            setTimeout(() => {
              const markedElem = document.querySelector('mark');
              if (markedElem) {
                markedElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 300);
          } else {
            loadMD(file);
          }
          resultsContainer.innerHTML = '';
          document.getElementById('searchInput').value = '';
        });
        resultsContainer.appendChild(resultItem);
      }
    } catch (err) {
      console.error("Ошибка загрузки файла для поиска:", file, err);
    }
  }
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const query = e.target.value;
  searchDocuments(query);
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('fileMenu').classList.toggle('open');
});
