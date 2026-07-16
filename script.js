/* ============================================================
   严佳祺 · 2026 设计作品集  —  交互动效
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 1. 标题逐字拆分动画 ---------- */
    function splitTitle() {
        var lines = document.querySelectorAll('.hero-title [data-split]');
        lines.forEach(function (line, li) {
            var accent = line.querySelector('.accent');
            var isAccent = !!accent;
            var text = line.textContent;
            line.textContent = '';
            text.split('').forEach(function (ch, i) {
                var span = document.createElement('span');
                span.className = 'char';
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                if (isAccent) span.classList.add('accent');
                // 每行内错开 + 行间错开
                span.style.animationDelay = (0.25 + li * 0.28 + i * 0.05) + 's';
                line.appendChild(span);
            });
        });
        // 触发动画
        requestAnimationFrame(function () {
            document.body.classList.add('hero-loaded');
        });
    }

    /* ---------- 2. 滚动入场 (IntersectionObserver) ---------- */
    function revealOnScroll() {
        var items = document.querySelectorAll('.reveal-up');
        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
        items.forEach(function (el) { io.observe(el); });
    }

    /* ---------- 3. 导航栏滚动态 + 高亮 ---------- */
    function navBehavior() {
        var nav = document.getElementById('navbar');
        var links = document.querySelectorAll('.nav-link');
        var sections = ['hero', 'about', 'works', 'contact']
            .map(function (id) { return document.getElementById(id); })
            .filter(Boolean);

        function onScroll() {
            var y = window.scrollY;
            nav.classList.toggle('scrolled', y > 40);

            // 高亮当前区块
            var current = 'hero';
            // 如果滚到底部，直接高亮最后一个section
            if (y + window.innerHeight >= document.documentElement.scrollHeight - 50) {
                current = sections[sections.length - 1].id;
            } else {
                sections.forEach(function (sec) {
                    if (y >= sec.offsetTop - 200) current = sec.id;
                });
            }
            links.forEach(function (l) {
                l.classList.toggle('active', l.getAttribute('href') === '#' + current);
            });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- 4. 鼠标视差 (打字机跟随) ---------- */
    function mouseParallax() {
        var visual = document.getElementById('visualFloat');
        var stars = document.querySelectorAll('.deco-star');
        if (!visual) return;
        // 仅在有精确指针的设备启用
        if (!window.matchMedia('(pointer:fine)').matches) return;

        var tx = 0, ty = 0, cx = 0, cy = 0;
        window.addEventListener('mousemove', function (e) {
            var rx = (e.clientX / window.innerWidth - 0.5);
            var ry = (e.clientY / window.innerHeight - 0.5);
            tx = rx * 26;
            ty = ry * 20;
            stars.forEach(function (s, i) {
                var f = (i + 1) * 8;
                s.style.transform = 'translate(' + (rx * f) + 'px,' + (ry * f) + 'px)';
            });
        });
        (function loop() {
            cx += (tx - cx) * 0.08;
            cy += (ty - cy) * 0.08;
            visual.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
            requestAnimationFrame(loop);
        })();
    }

    /* ---------- 5. 平滑锚点滚动 ---------- */
    function smoothAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var id = a.getAttribute('href');
                if (id === '#') return;
                var target = document.querySelector(id);
                if (target) {
                    e.preventDefault();
                    window.scrollTo({
                        top: target.offsetTop - (id === '#hero' ? 0 : 20),
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /* ---------- 6. 跑马灯无缝填充（任意屏宽都不留空白） ---------- */
    function marqueeFill() {
        var track = document.querySelector('.marquee-track');
        if (!track) return;
        var groups = track.querySelectorAll('.mq-group');
        if (!groups.length) return;
        // 以第一组为模板
        var template = groups[0];

        function build() {
            // 清空为单个模板组
            track.innerHTML = '';
            track.appendChild(template);
            var groupWidth = template.getBoundingClientRect().width;
            if (groupWidth <= 0) return;
            // 需要的“单份”宽度：至少覆盖视口宽度 + 一组冗余
            var needWidth = window.innerWidth + groupWidth;
            var copiesPerHalf = Math.max(1, Math.ceil(needWidth / groupWidth));
            // 轨道 = 两份，每份 copiesPerHalf 个组；translateX(-50%) 平移正好一份
            var total = copiesPerHalf * 2;
            for (var i = 1; i < total; i++) {
                var clone = template.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                track.appendChild(clone);
            }
            // 恒定速度：一份的宽度 / 速度(px/s)，各屏宽观感一致，数值越小越慢
            var SPEED = 55; // px/s，越小越慢
            var halfWidth = groupWidth * copiesPerHalf;
            track.style.animationDuration = (halfWidth / SPEED) + 's';
        }

        build();
        // 防抖处理 resize
        var t;
        window.addEventListener('resize', function () {
            clearTimeout(t);
            t = setTimeout(build, 200);
        });
    }

    /* ---------- 7. 作品手风琴：悬停展开切换 ---------- */
    function worksAccordion() {
        var cards = document.querySelectorAll('.works-accordion .wa-card');
        if (!cards.length) return;
        // 仅在精确指针设备启用 hover 切换（触屏走响应式全展开）
        if (!window.matchMedia('(pointer:fine)').matches) return;

        function activate(card) {
            cards.forEach(function (c) { c.classList.toggle('is-active', c === card); });
        }
        cards.forEach(function (card) {
            card.addEventListener('mouseenter', function () { activate(card); });
            // 键盘可达性：聚焦时也展开
            card.addEventListener('focus', function () { activate(card); });
        });
    }

    /* ---------- 8. 移动端汉堡菜单 ---------- */
    function mobileNav() {
        var toggle = document.getElementById('navToggle');
        var navbar = document.getElementById('navbar');
        if (!toggle || !navbar) return;

        toggle.addEventListener('click', function () {
            navbar.classList.toggle('nav-open');
            toggle.classList.toggle('is-open');
        });

        // 点击链接后自动关闭
        var links = navbar.querySelectorAll('.nav-link, .nav-cta');
        links.forEach(function (link) {
            link.addEventListener('click', function () {
                navbar.classList.remove('nav-open');
                toggle.classList.remove('is-open');
            });
        });
    }

    /* ---------- 9. 滚动进度条 ---------- */
    function scrollProgress() {
        var bar = document.createElement('div');
        bar.className = 'scroll-progress';
        document.body.appendChild(bar);

        function update() {
            var scrollTop = window.scrollY;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = progress + '%';
        }

        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /* ---------- 10. 页面加载动画(带模糊背景+进度+安抚文案) ---------- */
    function pageLoadAnim() {
        var loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = '<div class="loader-bg"></div>' +
            '<div class="loader-content">' +
            '<div class="loader-text">作品资源较大，正在为你加载中<br>请稍候片刻 ...</div>' +
            '<div class="loader-bar"><div class="loader-bar-fill"></div></div>' +
            '<div class="loader-pct">0%</div>' +
            '</div>';
        document.body.appendChild(loader);

        // Set blurred hero background
        var bg = loader.querySelector('.loader-bg');
        var heroImg = document.querySelector('.typewriter-img');
        if (heroImg && heroImg.src) {
            bg.style.backgroundImage = 'url(' + heroImg.src + ')';
        }

        // Track loading progress
        var fill = loader.querySelector('.loader-bar-fill');
        var pctEl = loader.querySelector('.loader-pct');
        var resources = document.querySelectorAll('img[src], link[rel="stylesheet"]');
        var total = Math.max(resources.length, 1);
        var loaded = 0;

        function tick() {
            loaded++;
            var pct = Math.min(Math.round(loaded / total * 100), 100);
            fill.style.width = pct + '%';
            pctEl.textContent = pct + '%';
        }

        resources.forEach(function(el) {
            if (el.complete || el.sheet) { tick(); return; }
            el.addEventListener('load', tick);
            el.addEventListener('error', tick);
        });

        window.addEventListener('load', function () {
            // Ensure 100%
            fill.style.width = '100%';
            pctEl.textContent = '100%';
            setTimeout(function () {
                loader.classList.add('loaded');
                setTimeout(function () {
                    if (loader.parentNode) loader.parentNode.removeChild(loader);
                }, 900);
            }, 400);
        });
    }

    /* ---------- 11. 离开首页前保存滚动位置 ---------- */
    function saveScrollOnLeave() {
        // 拦截所有跳转到 work-detail 的链接
        document.querySelectorAll('a[href*="work-detail"]').forEach(function(link) {
            link.addEventListener('click', function() {
                sessionStorage.setItem('indexScrollY', window.scrollY);
            });
        });
    }

    /* ---------- 12. 恢复首页滚动位置 ---------- */
    var isReturning = sessionStorage.getItem('indexScrollY') !== null;

    function restoreScroll() {
        var savedY = sessionStorage.getItem('indexScrollY');
        if (savedY !== null) {
            sessionStorage.removeItem('indexScrollY');
            var y = parseInt(savedY);
            // 立即定位，不要滚动动画
            window.scrollTo({ top: y, behavior: 'instant' });
            // 确保所有 reveal-up 元素在视口内的都直接显示
            document.querySelectorAll('.reveal-up').forEach(function(el) {
                var rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight) {
                    el.classList.add('in');
                }
            });
        }
    }

    /* ---------- init ---------- */
    document.addEventListener('DOMContentLoaded', function () {
        if (!isReturning) {
            pageLoadAnim();
        }
        splitTitle();
        revealOnScroll();
        navBehavior();
        mouseParallax();
        smoothAnchors();
        marqueeFill();
        worksAccordion();
        mobileNav();
        scrollProgress();
        saveScrollOnLeave();
        restoreScroll();
});
})();

/* ---------- 复制联系信息 ---------- */
function copyEmail(el) { copyValue(el); }
function copyValue(el) {
    var value = el.querySelector('.c-value').textContent.trim();
    navigator.clipboard.writeText(value).then(function () {
        showToast('复制成功');
    });
}

function showToast(msg) {
    var existing = document.querySelector('.toast-tip');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast-tip';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
        toast.classList.add('show');
    });
    setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () { toast.remove(); }, 300);
    }, 1500);
}

/* ---------- 首页后台预加载作品集图片(CDN加速) ---------- */
(function() {
    // CDN prefix (must match work-detail.js)
    var CDN = 'https://testingcf.jsdelivr.net/gh/CT6668/portfolio@main/';
    function cdn(path) {
        if (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') return path;
        return CDN + path;
    }

    // Only preload cover images (small, most important for first impression)
    var coverImages = [
        'assets/work-cover-1.jpg', 'assets/work-cover-2.jpg',
        'assets/work-cover-3.jpg', 'assets/work-cover-4.jpg'
    ];

    var preloadIndex = 0;

    function preloadNext() {
        if (preloadIndex >= coverImages.length) return;
        var img = new Image();
        img.onload = img.onerror = function() { preloadNext(); };
        img.src = cdn(coverImages[preloadIndex++]);
    }

    // Start preloading covers after page is fully loaded + 3s idle
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (window.requestIdleCallback) {
                window.requestIdleCallback(function() { preloadNext(); });
            } else {
                preloadNext();
            }
        }, 3000);
    });
})();
