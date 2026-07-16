// ========== Work data ==========
// pages 数组中每个对象: { type: 'image' | 'video' | 'pdf', src: '路径' }
var works = [
    {
        id: 1,
        title: 'C端妙蛙',
        subtitle: '频道首页改版',
        pages: [
            { type: 'image', src: 'assets/work-cover-1.jpg', w: 2560, h: 1440 },
            { type: 'image', src: 'assets/work1-page2.jpg', w: 2560, h: 1122 },
            { type: 'image', src: 'assets/work1-page03.jpg', w: 2560, h: 1356 },
            { type: 'image', src: 'assets/work1-page04.jpg', w: 2560, h: 1440 },
            { type: 'image', src: 'assets/work1-page05.jpg', w: 2560, h: 1509 },
            { type: 'image', src: 'assets/work1-page06.jpg', w: 2560, h: 1554 },
            { type: 'image', src: 'assets/work1-page07.jpg', w: 2560, h: 1164 },
            { type: 'image', src: 'assets/work1-page08.jpg', w: 2560, h: 2061 },
            { type: 'image', src: 'assets/work1-page09.jpg', w: 2457, h: 2560 },
            { type: 'image', src: 'assets/work1-page10.jpg', w: 2560, h: 1440 },
            { type: 'image', src: 'assets/work1-page11.jpg', w: 2560, h: 1440 },
            { type: 'image', src: 'assets/work1-page12.jpg', w: 2560, h: 1897 },
            { type: 'image', src: 'assets/work1-page13.jpg', w: 2560, h: 1440 },
            { type: 'image', src: 'assets/work1-page14.jpg', w: 2560, h: 1720 },
        ]
    },
    {
        id: 2,
        title: 'B端洋葱',
        subtitle: 'B端页面改版',
        pages: [
            { type: 'image', src: 'assets/work-cover-2.jpg', w: 2560, h: 1372 },
            { type: 'image', src: 'assets/work2-page16.jpg', w: 2560, h: 685 },
            { type: 'image', src: 'assets/work2-page17.jpg', w: 2560, h: 2361 },
            { type: 'image', src: 'assets/work2-page18.jpg', w: 2560, h: 1440 },
            { type: 'image', src: 'assets/work2-page19.jpg', w: 2560, h: 1038 },
            { type: 'image', src: 'assets/work2-page20.jpg', w: 2309, h: 2560 },
            { type: 'image', src: 'assets/work2-page21.jpg', w: 2560, h: 1036 },
            { type: 'image', src: 'assets/work2-page22.jpg', w: 2560, h: 2126 },
            { type: 'video', src: 'assets/work2-page23.mp4' },
            { type: 'image', src: 'assets/work2-page24.jpg', w: 2560, h: 1193 },
        ]
    },
    {
        id: 3,
        title: '平台组件',
        subtitle: 'CEM组件设计',
        pages: [
            { type: 'image', src: 'assets/work-cover-3.jpg', w: 2560, h: 1440 },
            { type: 'image', src: 'assets/work3-page26.jpg', w: 2560, h: 1333 },
            { type: 'image', src: 'assets/work3-page27.jpg', w: 2560, h: 1392 },
            { type: 'image', src: 'assets/work3-page28.jpg', w: 1952, h: 2560 },
            { type: 'image', src: 'assets/work3-page29.jpg', w: 2560, h: 825 },
            { type: 'image', src: 'assets/work3-page30.jpg', w: 2560, h: 1144 },
        ]
    },
    {
        id: 4,
        title: '其他视觉',
        subtitle: '其他视觉展示',
        pages: [
            { type: 'image', src: 'assets/work-cover-4.jpg', w: 2560, h: 1440 },
            { type: 'video', src: 'assets/work4-video-motion.mp4' },
            { type: 'video', src: 'assets/work4-video1.mp4' },
            { type: 'video', src: 'assets/work4-video2.mp4' },
            { type: 'image', src: 'assets/work4-3d.jpg', w: 2560, h: 1381 },
        ]
    }
];

// ========== Toast notification ==========
var toastEl = null;
var toastTimer = null;
function showToast(msg, duration) {
    duration = duration || 3000;
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast';
        document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { toastEl.classList.remove('show'); }, duration);
}

// ========== Loading progress bar ==========
var progressEl = null;
var totalImages = 0;
var loadedImages = 0;
var progressDisabled = false; // Skip progress bar if all cached

function initProgress(total, disabled) {
    totalImages = total;
    loadedImages = 0;
    progressDisabled = !!disabled;
    if (progressDisabled) return; // Don't show progress bar
    if (!progressEl) {
        progressEl = document.createElement('div');
        progressEl.className = 'load-progress';
        document.body.appendChild(progressEl);
    }
    progressEl.style.width = '0%';
    progressEl.classList.remove('done');
    progressEl.style.opacity = '1';
}
function updateProgress() {
    loadedImages++;
    if (progressDisabled || !progressEl) return;
    var pct = Math.round(loadedImages / totalImages * 100);
    progressEl.style.width = pct + '%';
    if (loadedImages >= totalImages) {
        // Mark this work as fully loaded
        try {
            var workId = getCurrentWorkId();
            sessionStorage.setItem('work_loaded_' + workId, '1');
        } catch(e) {}
        setTimeout(function() { progressEl.classList.add('done'); }, 300);
    }
}

// ========== Smart image loader (controlled concurrency) ==========
var CONCURRENT_LIMIT = 2; // Max simultaneous downloads
var loadQueue = [];
var activeLoads = 0;

function enqueueImageLoad(img, src, placeholder) {
    loadQueue.push({ img: img, src: src, placeholder: placeholder, retries: 0 });
    processQueue();
}

function processQueue() {
    while (activeLoads < CONCURRENT_LIMIT && loadQueue.length > 0) {
        var item = loadQueue.shift();
        loadImage(item);
    }
}

function loadImage(item) {
    activeLoads++;
    var img = item.img;
    var placeholder = item.placeholder;

    img.onload = function() {
        activeLoads--;
        img.classList.remove('loading');
        img.classList.add('loaded');
        // Remove placeholder
        if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }
        updateProgress();
        processQueue();
        // Preload next 2 images ahead
        preloadAhead();
    };

    img.onerror = function() {
        activeLoads--;
        if (item.retries < 2) {
            // Auto retry with delay
            item.retries++;
            setTimeout(function() {
                loadQueue.unshift(item);
                processQueue();
            }, 1000 * item.retries);
        } else {
            // Show error state with retry button
            img.style.display = 'none';
            if (placeholder) {
                placeholder.innerHTML = '';
                placeholder.className = 'fp-page-error';
                placeholder.style.height = placeholder.style.height || '400px';
                var errorIcon = document.createElement('div');
                errorIcon.className = 'fp-page-error-icon';
                errorIcon.textContent = '⚠️';
                var errorText = document.createElement('div');
                errorText.textContent = '图片加载失败';
                var retryBtn = document.createElement('button');
                retryBtn.className = 'fp-page-retry-btn';
                retryBtn.textContent = '点击重试';
                retryBtn.addEventListener('click', function() {
                    // Reset placeholder to shimmer
                    placeholder.className = 'fp-page-placeholder';
                    placeholder.innerHTML = '';
                    placeholder.style.height = placeholder.dataset.height || '400px';
                    img.style.display = 'block';
                    img.classList.add('loading');
                    item.retries = 0;
                    loadQueue.unshift(item);
                    processQueue();
                });
                placeholder.appendChild(errorIcon);
                placeholder.appendChild(errorText);
                placeholder.appendChild(retryBtn);
            }
            updateProgress();
            showToast('部分图片加载失败，请点击重试', 4000);
        }
        processQueue();
    };

    img.src = item.src;
}

// Preload images near viewport
var allImageItems = [];
var preloadedSet = {};
function preloadAhead() {
    // Find current scroll position and preload next few images
    var scrollY = window.scrollY || window.pageYOffset;
    var viewH = window.innerHeight;
    var threshold = scrollY + viewH * 2; // 2 screens ahead

    for (var i = 0; i < allImageItems.length; i++) {
        var info = allImageItems[i];
        if (preloadedSet[info.src]) continue;
        var rect = info.section.getBoundingClientRect();
        var absTop = rect.top + scrollY;
        if (absTop < threshold) {
            preloadedSet[info.src] = true;
            enqueueImageLoad(info.img, info.src, info.placeholder);
        }
    }
}

// ========== Format time helper ==========
function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

// ========== Get current work ID from URL ==========
function getCurrentWorkId() {
    var params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id')) || 1;
}

// ========== Highlight active nav link ==========
function highlightNavLink() {
    var workId = getCurrentWorkId();
    var navLinks = document.querySelectorAll('.nav-center .nav-link');
    navLinks.forEach(function(link) {
        var href = link.getAttribute('href');
        var match = href && href.match(/id=(\d+)/);
        var linkId = match ? parseInt(match[1]) : 0;
        link.classList.toggle('active', linkId === workId);
    });
}

// ========== Build pages (long-image mode) ==========
function buildPages() {
    var workId = getCurrentWorkId();
    var work = works.find(function(w) { return w.id === workId; });
    if (!work) return;

    // Clean up previous state
    if (window._scrollLoadHandler) {
        window.removeEventListener('scroll', window._scrollLoadHandler);
    }
    allImageItems = [];
    preloadedSet = {};
    loadQueue = [];
    activeLoads = 0;

    document.title = work.title + ' - Yan Jiaqi';

    var wrapper = document.getElementById('fp-wrapper');
    wrapper.innerHTML = '';

    work.pages.forEach(function(page, i) {
        var section = document.createElement('div');
        section.className = 'fp-page';

if (page.type === 'image') {
            // Create placeholder with correct aspect ratio
            var placeholder = document.createElement('div');
            placeholder.className = 'fp-page-placeholder';
            var placeholderH = '56.25%'; // default 16:9
            if (page.w && page.h) {
                placeholderH = (page.h / page.w * 100) + '%';
            }
            placeholder.style.paddingBottom = placeholderH;
            placeholder.dataset.height = placeholderH;

            // Create image (hidden initially, no src yet)
            var img = document.createElement('img');
            img.className = 'fp-page-img loading';
            img.alt = '';
            img.decoding = 'async';
            if (page.w && page.h) {
                img.width = page.w;
                img.height = page.h;
            }

            section.appendChild(placeholder);
            section.appendChild(img);

            // Register for smart loading
            allImageItems.push({
                img: img,
                src: page.src,
                placeholder: placeholder,
                section: section
            });
        } else if (page.type === 'video') {
            // Video wrapper for custom controls
            var videoWrap = document.createElement('div');
            videoWrap.className = 'video-wrap';

            var video = document.createElement('video');
            video.className = 'fp-page-video';
            video.src = page.src;
            video.playsInline = true;
            video.preload = 'metadata';

            // Custom controls bar
            var controls = document.createElement('div');
            controls.className = 'video-controls';

            // Play/Pause button
            var playBtn = document.createElement('button');
            playBtn.className = 'vc-btn vc-play';
            playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
            playBtn.addEventListener('click', function() {
                if (video.paused) { video._userPaused = false; video.play(); } else { video._userPaused = true; video.pause(); }
            });

            // Progress bar
            var progressWrap = document.createElement('div');
            progressWrap.className = 'vc-progress-wrap';
            var progressBar = document.createElement('div');
            progressBar.className = 'vc-progress';
            progressWrap.appendChild(progressBar);

            // Time display
            var timeDisplay = document.createElement('span');
            timeDisplay.className = 'vc-time';
            timeDisplay.textContent = '0:00 / 0:00';

            // Volume button
            var volBtn = document.createElement('button');
            volBtn.className = 'vc-btn vc-vol';
            volBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
            volBtn.addEventListener('click', function() {
                video.muted = !video.muted;
            });

            // Fullscreen button
            var fsBtn = document.createElement('button');
            fsBtn.className = 'vc-btn vc-fs';
            fsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline></svg>';
            fsBtn.addEventListener('click', function() {
                if (video.requestFullscreen) video.requestFullscreen();
            });

            controls.appendChild(playBtn);
            controls.appendChild(progressWrap);
            controls.appendChild(timeDisplay);
            controls.appendChild(volBtn);
            controls.appendChild(fsBtn);

            // Center play button (big)
            var centerPlay = document.createElement('button');
            centerPlay.className = 'vc-center-play';
            centerPlay.innerHTML = '<img src="assets/icon-play.png" alt="播放" style="width:58px;height:58px">';
            centerPlay.addEventListener('click', function() {
                video._userPaused = false;
                video.play();
            });

            videoWrap.appendChild(video);
            videoWrap.appendChild(centerPlay);
            videoWrap.appendChild(controls);
            section.appendChild(videoWrap);

            // Update play/pause icon + center button
            video.addEventListener('play', function() {
                playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
                centerPlay.classList.add('hidden');
            });
            video.addEventListener('pause', function() {
                playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                centerPlay.classList.remove('hidden');
            });

            // Update progress bar
            video.addEventListener('timeupdate', function() {
                if (video.duration) {
                    progressBar.style.width = (video.currentTime / video.duration * 100) + '%';
                    timeDisplay.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
                }
            });

            // Click progress bar to seek
            progressWrap.addEventListener('click', function(e) {
                var rect = progressWrap.getBoundingClientRect();
                var ratio = (e.clientX - rect.left) / rect.width;
                video.currentTime = ratio * video.duration;
            });

            // Update volume icon
            video.addEventListener('volumechange', function() {
                if (video.muted) {
                    volBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
                } else {
                    volBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
                }
            });

            // Click video to toggle play
            video.addEventListener('click', function() {
                if (video.paused) { video.play(); } else { video.pause(); }
            });
        } else if (page.type === 'pdf') {
            var iframe = document.createElement('iframe');
            iframe.className = 'fp-page-pdf';
            iframe.src = page.src;
            iframe.title = work.title + ' - PDF';
            section.appendChild(iframe);
        }

        wrapper.appendChild(section);
    });

    // Hide scroll hint if only 1 page
    var hint = document.getElementById('scroll-hint');
    if (hint) {
        hint.style.display = work.pages.length <= 1 ? 'none' : '';
    }

    // Add bottom padding so last image can scroll to center
    adjustBottomPadding();

    // Setup video auto play/pause
    initVideoAutoPlay();

    // Scroll to top
    window.scrollTo(0, 0);

    // Initialize smart image loading
    var imageCount = work.pages.filter(function(p) { return p.type === 'image'; }).length;

    // Check if this work was already fully loaded (cached)
    var alreadyLoaded = false;
    try {
        alreadyLoaded = sessionStorage.getItem('work_loaded_' + workId) === '1';
    } catch(e) {}

    // Try to detect cached images: probe first few images
    var cachedCount = 0;
    for (var ci = 0; ci < allImageItems.length; ci++) {
        var probe = new Image();
        probe.src = allImageItems[ci].src;
        if (probe.complete && probe.naturalWidth > 0) {
            cachedCount++;
        }
    }
    var allCached = cachedCount === allImageItems.length && allImageItems.length > 0;

    // If all images are cached (from preload or previous visit), skip progress & toast
    var skipProgressAndToast = alreadyLoaded || allCached;

    initProgress(imageCount, skipProgressAndToast);

    // Start loading: first image immediately, rest on scroll
    preloadedSet = {};

    if (allCached) {
        // All images are in browser cache, load them all immediately
        for (var ai = 0; ai < allImageItems.length; ai++) {
            preloadedSet[allImageItems[ai].src] = true;
            enqueueImageLoad(allImageItems[ai].img, allImageItems[ai].src, allImageItems[ai].placeholder);
        }
    } else {
        preloadAhead();

        // Toast hint only if not cached
        if (!skipProgressAndToast && imageCount > 3) {
            showToast('正在加载作品图片，请稍候...', 2000);
        }
    }

    // Listen for scroll to trigger loading more
    var scrollLoadHandler = function() {
        preloadAhead();
    };
    window.addEventListener('scroll', scrollLoadHandler, { passive: true });

    // Store handler for cleanup on page switch
    window._scrollLoadHandler = scrollLoadHandler;
}

// ========== Adjust bottom padding for last image centering ==========
function adjustBottomPadding() {
    var wrapper = document.getElementById('fp-wrapper');
    var pages = wrapper.querySelectorAll('.fp-page');
    if (pages.length <= 1) {
        wrapper.style.paddingBottom = '0';
        return;
    }
    var lastPage = pages[pages.length - 1];
    var lastImg = lastPage.querySelector('.fp-page-img');
    if (!lastImg) {
        wrapper.style.paddingBottom = '0';
        return;
    }

    function calc() {
        var imgHeight = lastImg.offsetHeight;
        var viewportHeight = window.innerHeight;
        if (imgHeight < viewportHeight) {
            var padding = (viewportHeight - imgHeight) / 2;
            wrapper.style.paddingBottom = padding + 'px';
        } else {
            wrapper.style.paddingBottom = '0';
        }
    }

    if (lastImg.complete) {
        calc();
    } else {
        lastImg.addEventListener('load', calc);
    }
}

// ========== Video auto play/pause on scroll ==========
var videoObserver = null;
var audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    // Unmute all videos once user interacts
    var videos = document.querySelectorAll('.fp-page-video');
    videos.forEach(function(video) {
        video.muted = false;
    });
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('scroll', unlockAudio);
}

function initVideoAutoPlay() {
    // Disconnect previous observer if exists
    if (videoObserver) {
        videoObserver.disconnect();
    }

    var videos = document.querySelectorAll('.fp-page-video');
    if (videos.length === 0) return;

    // Listen for first user interaction to unlock audio
    audioUnlocked = false;
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('scroll', unlockAudio);

    videoObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            var video = entry.target;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                if (video._userPaused) return;
                // Start muted for autoplay, will unmute on user interaction
                if (!audioUnlocked) {
                    video.muted = true;
                }
                video.play().catch(function() {});
            } else {
                video.pause();
            }
        });
    }, {
        threshold: [0, 0.5, 1]
    });

    videos.forEach(function(video) {
        videoObserver.observe(video);
    });
}

// ========== Scroll hint auto-hide ==========
var scrollHintHidden = false;

function resetScrollHint() {
    var hint = document.getElementById('scroll-hint');
    if (hint) {
        hint.classList.remove('hidden');
        scrollHintHidden = false;
    }
}

function initScrollHint() {
    var hint = document.getElementById('scroll-hint');
    if (!hint) return;

    window.addEventListener('scroll', function() {
        if (!scrollHintHidden && window.scrollY > 80) {
            hint.classList.add('hidden');
            scrollHintHidden = true;
        }
    });
}

// ========== SPA navigation ==========
function switchWork(workId) {
    var newUrl = 'work-detail.html?id=' + workId;
    history.pushState({ id: workId }, '', newUrl);

    // Fade out
    var wrapper = document.getElementById('fp-wrapper');
    wrapper.style.transition = 'opacity 0.3s ease';
    wrapper.style.opacity = '0';

    setTimeout(function() {
        buildPages();
        highlightNavLink();
        wrapper.style.opacity = '1';
        resetScrollHint();
    }, 300);
}

function setupSpaNavigation() {
    var navLinks = document.querySelectorAll('.nav-center .nav-link');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = link.getAttribute('href');
            var match = href && href.match(/id=(\d+)/);
            if (match) {
                e.preventDefault();
                var id = parseInt(match[1]);
                if (id !== getCurrentWorkId()) {
                    switchWork(id);
                }
            }
        });
    });

    window.addEventListener('popstate', function() {
        var wrapper = document.getElementById('fp-wrapper');
        wrapper.style.transition = 'opacity 0.3s ease';
        wrapper.style.opacity = '0';
        setTimeout(function() {
            buildPages();
            highlightNavLink();
            wrapper.style.opacity = '1';
            resetScrollHint();
        }, 300);
    });
}

// ========== Page transition ==========
function initPageTransition() {
    var transition = document.querySelector('.page-transition');
    setTimeout(function() {
        transition.classList.remove('active');
    }, 100);

    document.querySelectorAll('a[href]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = link.getAttribute('href');
            // Skip SPA nav links
            if (href && href.indexOf('work-detail.html?id=') !== -1) return;
            if (href && href.charAt(0) !== '#' && href !== '#') {
                e.preventDefault();
                transition.classList.add('active');
                setTimeout(function() {
                    window.location.href = href;
                }, 400);
            }
        });
    });
}

// ========== Navbar scroll style ==========
function initNavbar() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    // Always show scrolled style on detail page
    nav.classList.add('scrolled');
}

// ========== Fullscreen toggle ==========
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function() {});
    } else {
        document.exitFullscreen().catch(function() {});
    }
}

// Update button text/icon on fullscreen change
document.addEventListener('fullscreenchange', function() {
    var btn = document.getElementById('fullscreen-btn');
    if (!btn) return;
    if (document.fullscreenElement) {
        btn.innerHTML = '退出全屏 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
    } else {
        btn.innerHTML = '全屏 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
    }
    // Recalculate bottom padding after fullscreen change
    setTimeout(function() {
        adjustBottomPadding();
    }, 200);
});

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', function() {
    buildPages();
    highlightNavLink();
    setupSpaNavigation();
    initPageTransition();
    initNavbar();
    initScrollHint();

    // Recalculate bottom padding on resize
    window.addEventListener('resize', function() {
        adjustBottomPadding();
    });
});
