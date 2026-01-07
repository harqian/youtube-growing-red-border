(() => {
  let startTime = null;
  let baseWarningTime = 15 * 60 * 1000; // 15 minutes base time
  let WARNING_TIME = baseWarningTime;
  let currentConfidence = 0;  // start with 0 confidence
  let borderInterval = null;
  let CONFIDENCE_THRESHOLD = 0.4;
  let isEnabled = true;

  // Load settings from storage
  chrome.storage.sync.get({
    enabled: true,
    warningTime: 15,
    confidenceThreshold: 0.4
  }, (settings) => {
    isEnabled = settings.enabled;
    WARNING_TIME = settings.warningTime * 60 * 1000;
    CONFIDENCE_THRESHOLD = settings.confidenceThreshold;
  });

  async function classifyTitle(title) {
    if (!isEnabled) {
      removeBorder();
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`-----------------------------------------\n\n${JSON.stringify(data)}\n\n-----------------------------------------`)
      
      if (!data || typeof data.confidence !== 'number') {
        throw new Error('Invalid response format');
      }

      currentConfidence = data.confidence;
      
      if (currentConfidence >= CONFIDENCE_THRESHOLD) {
        initializeBorder();
      } else {
        removeBorder();
      }
      
      return data;
    } catch (error) {
      console.error('Error classifying title:', error);
      currentConfidence = 0;
      removeBorder();
    }
  }

  const removeBorder = () => {
    if (borderInterval) {
      clearInterval(borderInterval);
      borderInterval = null;
    }
    const borderOverlay = document.querySelector('.yt-time-warning-border');
    if (borderOverlay) {
      borderOverlay.remove();
    }
  };

  const createBorderStyle = () => {
    const style = document.createElement('style');
    style.textContent = `
      .yt-time-warning-border {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 2147483647;
        box-sizing: border-box;
        transition: all 1s;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .yt-time-warning-content {
        position: relative;
        width: 100%;
        height: 100%;
        transition: all 1s;
        border: 40px solid transparent;
        box-shadow: inset 0 0 100px transparent;
      }
      .yt-time-warning-edge {
        position: fixed;
        background: red;
        transition: all 1s;
        pointer-events: none;
        z-index: 2147483647;
      }
      .yt-time-warning-top,
      .yt-time-warning-bottom {
        left: 0;
        width: 100%;
        height: 0;
      }
      .yt-time-warning-left,
      .yt-time-warning-right {
        top: 0;
        width: 0;
        height: 100%;
      }
      .yt-time-warning-top { top: 0; }
      .yt-time-warning-bottom { bottom: 0; }
      .yt-time-warning-left { left: 0; }
      .yt-time-warning-right { right: 0; }
    `;
    document.head.appendChild(style);
  };

  const updateBorder = () => {
    if (!startTime) return;

    const timeSpent = Date.now() - startTime;
    const percentage = Math.min(timeSpent / WARNING_TIME, 1);

    let borderOverlay = document.querySelector('.yt-time-warning-border');
    if (!borderOverlay) {
      borderOverlay = document.createElement('div');
      borderOverlay.className = 'yt-time-warning-border';
      borderOverlay.innerHTML = `
        <div class="yt-time-warning-content"></div>
        <div class="yt-time-warning-edge yt-time-warning-top"></div>
        <div class="yt-time-warning-edge yt-time-warning-bottom"></div>
        <div class="yt-time-warning-edge yt-time-warning-left"></div>
        <div class="yt-time-warning-edge yt-time-warning-right"></div>
      `;
      document.body.appendChild(borderOverlay);
    }

    const content = borderOverlay.querySelector('.yt-time-warning-content');
    const edges = borderOverlay.querySelectorAll('.yt-time-warning-edge');

    // Shrink the content area
    const shrinkage = percentage * 40; // Shrinks up to 40%
    content.style.width = `${100 - shrinkage}%`;
    content.style.height = `${100 - shrinkage}%`;

    // Grow the edges
    const edgeSize = percentage * 10; // Grows to 10vh/vw
    const baseOpacity = Math.min(0.1 + (percentage * 0.9), 1);
    const intensityMultiplier = 0.5 + (currentConfidence * 0.5); // Scale from 0.5 to 1.0
    const borderColor = `rgba(255, 0, 0, ${baseOpacity * intensityMultiplier})`;
    const glowColor = `rgba(255, 0, 0, ${baseOpacity * 0.4 * intensityMultiplier})`;
    const edgeColor = `rgba(255, 0, 0, ${baseOpacity * 0.3 * intensityMultiplier})`;

    edges.forEach(edge => {
      edge.style.background = edgeColor;
      if (edge.classList.contains('yt-time-warning-top') ||
        edge.classList.contains('yt-time-warning-bottom')) {
        edge.style.height = `${edgeSize}vh`;
      }
      if (edge.classList.contains('yt-time-warning-left') ||
        edge.classList.contains('yt-time-warning-right')) {
        edge.style.width = `${edgeSize}vw`;
      }
    });

    // Growing borders and glow
    const borderSize = 40 + (percentage * 160); // Grows from 40px to 200px
    const innerGlowSize = 100 + (percentage * 400); // Grows from 100px to 500px
    const outerGlowSize = 50 + (percentage * 250); // Grows from 50px to 300px

    content.style.border = `${borderSize}px solid ${borderColor}`;
    content.style.boxShadow = `inset 0 0 ${innerGlowSize}px ${glowColor},
                              0 0 ${outerGlowSize}px ${glowColor}`;

    // Add background gradient
    content.style.background = `
      linear-gradient(to right,
        ${glowColor},
        transparent 50%
      ),
      linear-gradient(to left,
        ${glowColor},
        transparent 50%
      ),
      linear-gradient(to bottom,
        ${glowColor},
        transparent 50%
      ),
      linear-gradient(to top,
        ${glowColor},
        transparent 50%
      )
    `;
  };

  const initializeBorder = () => {
    startTime = Date.now();
    createBorderStyle();

    if (borderInterval) {
      clearInterval(borderInterval);
    }
    borderInterval = setInterval(updateBorder, 1000);
    updateBorder();
  };

  const handleTitleClassification = async () => {
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer');
    if (titleElement) {
      const videoTitle = titleElement.textContent.trim();
      await classifyTitle(videoTitle);
    }
  };

  // Initialize only does classification, border is added only if confidence is high enough
  const initialize = () => {
    removeBorder(); // Clear any existing border
    // Wait for title element to be available
    setTimeout(async () => {
      await handleTitleClassification();
    }, 1000);
  };

  // Initialize when the script loads
  initialize();

  // Listen for page navigation
  document.addEventListener('yt-navigate-finish', initialize);

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    if (obj.type === "NEW") {
      initialize();
    } else if (obj.type === "TOGGLE_WARNING") {
      isEnabled = obj.enabled;
      if (!isEnabled) {
        removeBorder();
      } else {
        handleTitleClassification();
      }
    } else if (obj.type === "UPDATE_SETTINGS") {
      if (obj.warningTime !== undefined) {
        WARNING_TIME = obj.warningTime * 60 * 1000;
      }
      if (obj.confidenceThreshold !== undefined) {
        CONFIDENCE_THRESHOLD = obj.confidenceThreshold;
      }
      handleTitleClassification();
    }
  });
})();

