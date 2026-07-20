"use strict";

const imageInput =
  document.getElementById("imageInput");

const fileCount =
  document.getElementById("fileCount");

const previewList =
  document.getElementById("previewList");

const columnInput =
  document.getElementById("columnInput");

const spacingInput =
  document.getElementById("spacingInput");

const fileNameInput =
  document.getElementById("fileNameInput");

const trimCheckbox =
  document.getElementById("trimCheckbox");

const sheetSize =
  document.getElementById("sheetSize");

const sizeWarning =
  document.getElementById("sizeWarning");

const createdSize =
  document.getElementById("createdSize");

const createSheetButton =
  document.getElementById("createSheetButton");

const downloadButton =
  document.getElementById("downloadButton");

const downloadXmlButton =
  document.getElementById("downloadXmlButton");

const spriteCanvas =
  document.getElementById("spriteCanvas");

const canvasEmptyMessage =
  document.getElementById("canvasEmptyMessage");

const fpsInput =
  document.getElementById("fpsInput");

const loopCheckbox =
  document.getElementById("loopCheckbox");

const previousFrameButton =
  document.getElementById(
    "previousFrameButton"
  );

const playPreviewButton =
  document.getElementById(
    "playPreviewButton"
  );

const stopPreviewButton =
  document.getElementById(
    "stopPreviewButton"
  );

const nextFrameButton =
  document.getElementById(
    "nextFrameButton"
  );

const previewFrameStatus =
  document.getElementById(
    "previewFrameStatus"
  );

const animationPreviewCanvas =
  document.getElementById(
    "animationPreviewCanvas"
  );

const animationPreviewEmpty =
  document.getElementById(
    "animationPreviewEmpty"
  );

const animationPreviewContext =
  animationPreviewCanvas.getContext("2d");

const context =
  spriteCanvas.getContext("2d");

const animationNameInput =
  document.getElementById(
    "animationNameInput"
  );

const addAnimationButton =
  document.getElementById(
    "addAnimationButton"
  );

const animationGroupList =
  document.getElementById(
    "animationGroupList"
  );

const activeAnimationName =
  document.getElementById(
    "activeAnimationName"
  );

let sheetCreated = false;
let generatedXml = "";

let animationGroups = [
  {
    id: createAnimationGroupId(),
    name: "idle",
    frames: []
  }
];

let currentAnimationId =
  animationGroups[0].id;

let loadedFrames =
  animationGroups[0].frames;

let currentPreviewFrame = 0;
let previewTimerId = null;
let previewPlaying = false;

imageInput.addEventListener(
  "change",
  handleImageSelection
);

columnInput.addEventListener(
  "input",
  handleSettingChange
);

spacingInput.addEventListener(
  "input",
  handleSettingChange
);

trimCheckbox.addEventListener(
  "change",
  handleSettingChange
);

fileNameInput.addEventListener(
  "input",
  validateFileName
);

createSheetButton.addEventListener(
  "click",
  createSpriteSheet
);

downloadButton.addEventListener(
  "click",
  downloadSpriteSheet
);

downloadXmlButton.addEventListener(
  "click",
  downloadXmlFile
);

playPreviewButton.addEventListener(
  "click",
  playAnimationPreview
);

stopPreviewButton.addEventListener(
  "click",
  stopAnimationPreview
);

previousFrameButton.addEventListener(
  "click",
  showPreviousPreviewFrame
);

nextFrameButton.addEventListener(
  "click",
  showNextPreviewFrame
);

fpsInput.addEventListener(
  "change",
  handleFpsChange
);

fpsInput.addEventListener(
  "input",
  normalizeFpsInput
);

addAnimationButton.addEventListener(
  "click",
  addAnimationGroup
);

animationNameInput.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addAnimationGroup();
  }
);

async function handleImageSelection() {
  try {
    const files =
      Array.from(imageInput.files ?? []);

    const pngFiles = files
      .filter((file) => {
        return (
          file.type === "image/png" ||
          file.name.toLowerCase().endsWith(".png")
        );
      })
      .sort((fileA, fileB) => {
        return fileA.name.localeCompare(
          fileB.name,
          undefined,
          {
            numeric: true,
            sensitivity: "base"
          }
        );
      });

if (pngFiles.length === 0) {
  fileCount.textContent =
    "PNG画像が選択されていません。";

  return;
}

    fileCount.textContent =
      "画像を読み込んでいます……";

const loadedResults = [];

for (
  let index = 0;
  index < pngFiles.length;
  index += 1
) {
  const file =
    pngFiles[index];

  fileCount.textContent =
    `画像を読み込み中… ${index + 1} / ${pngFiles.length}`;

  const loadedFrame =
    await loadImageFile(file);

  loadedResults.push(
    loadedFrame
  );
}

loadedFrames =
  loadedResults;

const currentGroup =
  getCurrentAnimationGroup();

if (!currentGroup) {
  throw new Error(
    "選択中のアニメーションが見つかりません。"
  );
}

currentGroup.frames =
  loadedFrames;

loadedFrames =
  currentGroup.frames;

showPreviews();
initializeAnimationPreview();
renderAnimationGroupList();
updateExportButtonState();

    fileCount.textContent =
      `${loadedFrames.length}枚のPNGを読み込みました。`;

    createSheetButton.disabled = false;

    markSheetAsOutdated();
    updateEstimatedSize();
} catch (error) {
  console.error(
    "画像読み込み処理でエラーが発生しました。",
    error
  );

  const errorMessage =
    error instanceof Error
      ? error.message
      : String(error);

  alert(
    `処理中にエラーが発生しました。\n\n${errorMessage}`
  );
}
}

function loadImageFile(file) {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image();

      const imageUrl =
        URL.createObjectURL(file);

      image.onload = () => {
        try {
          const trimData =
            calculateTransparentBounds(
              image
            );

          resolve({
            fileName: file.name,
            image,

            width:
              image.naturalWidth,

            height:
              image.naturalHeight,

            trimX:
              trimData.x,

            trimY:
              trimData.y,

            trimWidth:
              trimData.width,

            trimHeight:
              trimData.height,

            isFullyTransparent:
              trimData.isFullyTransparent
          });
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(
            imageUrl
          );
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          imageUrl
        );

        reject(
          new Error(
            `${file.name}の画像データをブラウザで開けませんでした。`
          )
        );
      };

      image.src =
        imageUrl;
    }
  );
}

function showPreviews() {
  previewList.innerHTML = "";

  if (loadedFrames.length === 0) {
  previewList.innerHTML = `
    <p class="empty-message">
      このアニメーションには、まだ画像がありません。
    </p>
  `;

  return;
}

  loadedFrames.forEach((frame, index) => {
    const item =
      document.createElement("article");

    item.className = "preview-item";

    const number =
      document.createElement("span");

    number.className = "frame-number";
    number.textContent = `#${index}`;

    const image =
      document.createElement("img");

    image.src = frame.image.src;
    image.alt = frame.fileName;

    const name =
      document.createElement("p");

    name.textContent = frame.fileName;

    const frameSize =
      document.createElement("p");

    frameSize.className = "frame-size";

frameSize.textContent =
  frame.isFullyTransparent
    ? `${frame.width} × ${frame.height}px・全体が透明`
    : (
      `元：${frame.width} × ${frame.height}px` +
      ` / 切抜：${frame.trimWidth} × ${frame.trimHeight}px`
    );

    item.append(
      number,
      image,
      name,
      frameSize
    );

    previewList.appendChild(item);
  });
}

function handleSettingChange() {
  normalizeNumberInputs();
  updateEstimatedSize();
  markSheetAsOutdated();

  if (loadedFrames.length > 0) {
    renderAnimationPreviewFrame();
  }
}

function normalizeNumberInputs() {
  const columns =
    Number.parseInt(columnInput.value, 10);

  const spacing =
    Number.parseInt(spacingInput.value, 10);

  if (
    !Number.isFinite(columns) ||
    columns < 1
  ) {
    columnInput.value = "1";
  }

  if (
    !Number.isFinite(spacing) ||
    spacing < 0
  ) {
    spacingInput.value = "0";
  }
}

function getSheetSettings(
  frameCount = loadedFrames.length
) {
  const requestedColumns =
    Number.parseInt(columnInput.value, 10);

  const spacing =
    Number.parseInt(spacingInput.value, 10);

  const columns = Math.max(
    1,
    Math.min(
      requestedColumns || 1,
      frameCount || 1
    )
  );

  const safeSpacing = Math.max(
    0,
    spacing || 0
  );

  return {
    columns,
    spacing: safeSpacing
  };
}

function calculateSheetLayout(
  frames = getExportFrames()
) {
  if (frames.length === 0) {
    return null;
  }

const { columns, spacing } =
  getSheetSettings(
    frames.length
  );

const renderFrames =
  frames.map(
    getFrameRenderData
  );

const frameWidth = Math.max(
  ...renderFrames.map(
    (frame) => frame.width
  )
);

const frameHeight = Math.max(
  ...renderFrames.map(
    (frame) => frame.height
  )
);

  const rows = Math.ceil(
    frames.length / columns
  );

  const width =
    frameWidth * columns +
    spacing * Math.max(0, columns - 1);

  const height =
    frameHeight * rows +
    spacing * Math.max(0, rows - 1);

  return {
    columns,
    rows,
    spacing,
    frameWidth,
    frameHeight,
    width,
    height
  };
}

function updateEstimatedSize() {
  const layout =
    calculateSheetLayout();

  if (!layout) {
    sheetSize.textContent =
      "画像を読み込むと表示されます。";

    sizeWarning.hidden = true;

    return;
  }

  sheetSize.textContent =
    `${layout.width} × ${layout.height}px ` +
    `（${layout.columns}列 × ${layout.rows}行）`;

  updateSizeWarning(
    layout.width,
    layout.height
  );
}

function updateSizeWarning(width, height) {
  const longestSide =
    Math.max(width, height);

  const pixelCount =
    width * height;

  if (
    longestSide > 16384 ||
    pixelCount > 100_000_000
  ) {
    sizeWarning.hidden = false;

    sizeWarning.textContent =
      "⚠️ 完成画像がかなり大きくなります。端末によっては作成や保存に失敗する可能性があります。列数を調整するか、画像を複数回に分けてください。";

    return;
  }

  if (
    longestSide > 8192 ||
    pixelCount > 40_000_000
  ) {
    sizeWarning.hidden = false;

    sizeWarning.textContent =
      "⚠️ 完成画像のサイズが大きめです。タブレットでは処理が重くなる可能性があります。";

    return;
  }

  sizeWarning.hidden = true;
  sizeWarning.textContent = "";
}

function createSpriteSheet() {
  try {
    const exportFrames =
      getExportFrames();

    const layout =
      calculateSheetLayout(
        exportFrames
      );

    if (!layout) {
      throw new Error(
        "画像が読み込まれていません。"
      );
    }

    validateCanvasSize(layout);

    spriteCanvas.width =
      layout.width;

    spriteCanvas.height =
      layout.height;

    context.clearRect(
      0,
      0,
      spriteCanvas.width,
      spriteCanvas.height
    );

    const xmlFrames = [];

    exportFrames.forEach(
      (frame, index) => {
        const renderData =
          getFrameRenderData(frame);

        const column =
          index % layout.columns;

        const row =
          Math.floor(
            index / layout.columns
          );

        const cellX =
          column *
          (
            layout.frameWidth +
            layout.spacing
          );

        const cellY =
          row *
          (
            layout.frameHeight +
            layout.spacing
          );

        const imageX =
          cellX +
          Math.floor(
            (
              layout.frameWidth -
              renderData.width
            ) / 2
          );

        const imageY =
          cellY +
          (
            layout.frameHeight -
            renderData.height
          );

        if (!frame.isFullyTransparent) {
          context.drawImage(
            frame.image,

            renderData.sourceX,
            renderData.sourceY,
            renderData.width,
            renderData.height,

            imageX,
            imageY,
            renderData.width,
            renderData.height
          );
        }

        xmlFrames.push({
          name: frame.xmlName,

          x: imageX,
          y: imageY,

          width: renderData.width,
          height: renderData.height,

          frameX: renderData.frameX,
          frameY: renderData.frameY,

          frameWidth:
            renderData.frameWidth,

          frameHeight:
            renderData.frameHeight
        });
      }
    );

    generatedXml =
      createSparrowXml(xmlFrames);

    sheetCreated = true;

    downloadButton.disabled = false;
    downloadXmlButton.disabled = false;

    canvasEmptyMessage.hidden = true;

    createdSize.textContent =
      `作成完了：${layout.width} × ${layout.height}px`;

    spriteCanvas.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  } catch (error) {
    console.error(error);

    alert(
      error instanceof Error
        ? error.message
        : "スプライトシートを作成できませんでした。"
    );
  }
}

function validateFileName() {
  fileNameInput.value =
    fileNameInput.value.replace(
      /[\\/:*?"<>|]/g,
      ""
    );
}

function getSafeFileName() {
  const cleanedName =
    fileNameInput.value
      .trim()
      .replace(
        /[\\/:*?"<>|]/g,
        ""
      )
      .replace(/\.png$/i, "");

  return cleanedName || "sprite-sheet";
}

function downloadSpriteSheet() {
  if (
    !sheetCreated ||
    spriteCanvas.width === 0 ||
    spriteCanvas.height === 0
  ) {
    alert(
      "先にスプライトシートを作成してください。"
    );

    return;
  }

  spriteCanvas.toBlob(
    (blob) => {
      if (!blob) {
        alert(
          "PNGを作成できませんでした。"
        );

        return;
      }

      const downloadUrl =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = downloadUrl;

      link.download =
        `${getSafeFileName()}.png`;

      document.body.appendChild(link);

      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(
          downloadUrl
        );
      }, 1000);
    },
    "image/png"
  );
}

function resetImages() {
  loadedFrames = [];
  sheetCreated = false;

  previewList.innerHTML = `
    <p class="empty-message">
      読み込んだ画像がここに表示されます。
    </p>
  `;

  spriteCanvas.width = 0;
  spriteCanvas.height = 0;

  createSheetButton.disabled = true;
  downloadButton.disabled = true;
  downloadXmlButton.disabled = true;
  generatedXml = "";

  canvasEmptyMessage.hidden = false;

  createdSize.textContent = "";

  sheetSize.textContent =
    "画像を読み込むと表示されます。";

  sizeWarning.hidden = true;
  sizeWarning.textContent = "";

  resetAnimationPreview();
}

function getFrameName(fileName, index) {
  const nameWithoutExtension =
    fileName.replace(/\.png$/i, "");

  const cleanedName =
    nameWithoutExtension
      .trim()
      .replace(/[<>&"'\\]/g, "_");

  if (cleanedName) {
    return cleanedName;
  }

  return `frame${String(index).padStart(4, "0")}`;
}

function createSparrowXml(xmlFrames) {
  const imagePath =
    `${getSafeFileName()}.png`;

  const subTextures =
    xmlFrames.map((frame) => {
return (
  `    <SubTexture` +
  ` name="${escapeXml(frame.name)}"` +
  ` x="${frame.x}"` +
  ` y="${frame.y}"` +
  ` width="${frame.width}"` +
  ` height="${frame.height}"` +
  ` frameX="${frame.frameX}"` +
  ` frameY="${frame.frameY}"` +
  ` frameWidth="${frame.frameWidth}"` +
  ` frameHeight="${frame.frameHeight}"` +
  `/>`
);
    });

  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<TextureAtlas imagePath="${escapeXml(imagePath)}">`,
    ...subTextures,
    `</TextureAtlas>`,
    ``
  ].join("\n");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadXmlFile() {
  if (
    !sheetCreated ||
    !generatedXml
  ) {
    alert(
      "先にスプライトシートを作成してください。"
    );

    return;
  }

  const xmlBlob =
    new Blob(
      [generatedXml],
      {
        type: "application/xml;charset=utf-8"
      }
    );

  const downloadUrl =
    URL.createObjectURL(xmlBlob);

  const link =
    document.createElement("a");

  link.href = downloadUrl;

  link.download =
    `${getSafeFileName()}.xml`;

  document.body.appendChild(link);

  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(
      downloadUrl
    );
  }, 1000);
}

function calculateTransparentBounds(image) {
  const width =
    image.naturalWidth;

  const height =
    image.naturalHeight;

  const analysisCanvas =
    document.createElement("canvas");

  analysisCanvas.width = width;
  analysisCanvas.height = height;

  const analysisContext =
    analysisCanvas.getContext(
      "2d",
      {
        willReadFrequently: true
      }
    );

  if (!analysisContext) {
    throw new Error(
      "画像解析用のCanvasを作成できませんでした。"
    );
  }

  analysisContext.clearRect(
    0,
    0,
    width,
    height
  );

  analysisContext.drawImage(
    image,
    0,
    0
  );

  const imageData =
    analysisContext.getImageData(
      0,
      0,
      width,
      height
    );

  const pixels =
    imageData.data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  /*
   * pixelsは、
   * R・G・B・Aの4個ずつ並んでいます。
   *
   * index + 3が透明度です。
   */
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex =
        (y * width + x) * 4;

      const alpha =
        pixels[pixelIndex + 3];

      if (alpha === 0) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  /*
   * 画像全体が透明だった場合は、
   * 1×1pxの透明フレームとして扱います。
   */
  if (
    maxX < minX ||
    maxY < minY
  ) {
    return {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      isFullyTransparent: true
    };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    isFullyTransparent: false
  };
}

function getFrameRenderData(frame) {
  if (!trimCheckbox.checked) {
    return {
      sourceX: 0,
      sourceY: 0,

      width: frame.width,
      height: frame.height,

      frameX: 0,
      frameY: 0,

      frameWidth: frame.width,
      frameHeight: frame.height
    };
  }

  return {
    sourceX: frame.trimX,
    sourceY: frame.trimY,

    width: frame.trimWidth,
    height: frame.trimHeight,

    /*
     * 切り抜いた位置をマイナス値で記録すると、
     * FNF上で元のキャンバス位置へ戻せます。
     */
    frameX: -frame.trimX,
    frameY: -frame.trimY,

    frameWidth: frame.width,
    frameHeight: frame.height
  };
}
function initializeAnimationPreview() {
  stopAnimationPreview();

  currentPreviewFrame = 0;

  if (loadedFrames.length === 0) {
    resetAnimationPreview();
    return;
  }

  /*
   * すべての元画像が入るサイズを
   * プレビューCanvasのサイズにします。
   */
  const previewWidth = Math.max(
    ...loadedFrames.map(
      (frame) => frame.width
    )
  );

  const previewHeight = Math.max(
    ...loadedFrames.map(
      (frame) => frame.height
    )
  );

  animationPreviewCanvas.width =
    previewWidth;

  animationPreviewCanvas.height =
    previewHeight;

  animationPreviewEmpty.hidden = true;

  previousFrameButton.disabled = false;
  playPreviewButton.disabled = false;
  stopPreviewButton.disabled = false;
  nextFrameButton.disabled = false;

  renderAnimationPreviewFrame();
}
function renderAnimationPreviewFrame() {
  if (loadedFrames.length === 0) {
    return;
  }

  const frame =
    loadedFrames[currentPreviewFrame];

  const renderData =
    getFrameRenderData(frame);

  animationPreviewContext.clearRect(
    0,
    0,
    animationPreviewCanvas.width,
    animationPreviewCanvas.height
  );

  /*
   * 元画像のキャンバスを、
   * プレビューCanvasの下中央へ揃えます。
   */
  const originalCanvasX =
    Math.floor(
      (
        animationPreviewCanvas.width -
        frame.width
      ) / 2
    );

  const originalCanvasY =
    animationPreviewCanvas.height -
    frame.height;

  /*
   * トリミングONの場合も、
   * 元画像内での位置へ描画するため、
   * アニメーションがガタつきません。
   */
  const drawX =
    originalCanvasX +
    renderData.sourceX;

  const drawY =
    originalCanvasY +
    renderData.sourceY;

  if (!frame.isFullyTransparent) {
    animationPreviewContext.drawImage(
      frame.image,

      renderData.sourceX,
      renderData.sourceY,
      renderData.width,
      renderData.height,

      drawX,
      drawY,
      renderData.width,
      renderData.height
    );
  }

  previewFrameStatus.textContent =
    `フレーム ${currentPreviewFrame + 1}` +
    ` / ${loadedFrames.length}` +
    `　${frame.fileName}`;
}
function getPreviewFps() {
  const parsedFps =
    Number.parseInt(
      fpsInput.value,
      10
    );

  if (!Number.isFinite(parsedFps)) {
    return 24;
  }

  return Math.max(
    1,
    Math.min(parsedFps, 60)
  );
}
function normalizeFpsInput() {
  const fps =
    Number.parseInt(
      fpsInput.value,
      10
    );

  if (!Number.isFinite(fps)) {
    return;
  }

  if (fps < 1) {
    fpsInput.value = "1";
  }

  if (fps > 60) {
    fpsInput.value = "60";
  }
}
function playAnimationPreview() {
  if (
    loadedFrames.length === 0 ||
    previewPlaying
  ) {
    return;
  }

  /*
   * ループOFFで最後まで再生済みの場合は、
   * 最初から再生します。
   */
  if (
    !loopCheckbox.checked &&
    currentPreviewFrame >=
      loadedFrames.length - 1
  ) {
    currentPreviewFrame = 0;
    renderAnimationPreviewFrame();
  }

  previewPlaying = true;

  playPreviewButton.disabled = true;

  startPreviewTimer();
}
function startPreviewTimer() {
  clearPreviewTimer();

  const fps =
    getPreviewFps();

  const interval =
    1000 / fps;

  previewTimerId =
    window.setInterval(() => {
      advanceAnimationPreview();
    }, interval);
}
function advanceAnimationPreview() {
  if (loadedFrames.length === 0) {
    stopAnimationPreview();
    return;
  }

  const lastFrameIndex =
    loadedFrames.length - 1;

  if (
    currentPreviewFrame >=
    lastFrameIndex
  ) {
    if (loopCheckbox.checked) {
      currentPreviewFrame = 0;
    } else {
      stopAnimationPreview();
      return;
    }
  } else {
    currentPreviewFrame += 1;
  }

  renderAnimationPreviewFrame();
}
function stopAnimationPreview() {
  clearPreviewTimer();

  previewPlaying = false;

  playPreviewButton.disabled =
    loadedFrames.length === 0;
}
function clearPreviewTimer() {
  if (previewTimerId === null) {
    return;
  }

  window.clearInterval(
    previewTimerId
  );

  previewTimerId = null;
}
function showPreviousPreviewFrame() {
  if (loadedFrames.length === 0) {
    return;
  }

  stopAnimationPreview();

  currentPreviewFrame -= 1;

  if (currentPreviewFrame < 0) {
    currentPreviewFrame =
      loadedFrames.length - 1;
  }

  renderAnimationPreviewFrame();
}
function showNextPreviewFrame() {
  if (loadedFrames.length === 0) {
    return;
  }

  stopAnimationPreview();

  currentPreviewFrame += 1;

  if (
    currentPreviewFrame >=
    loadedFrames.length
  ) {
    currentPreviewFrame = 0;
  }

  renderAnimationPreviewFrame();
}
function handleFpsChange() {
  normalizeFpsInput();

  if (!previewPlaying) {
    return;
  }

  /*
   * 再生中なら、新しいFPSで
   * タイマーを作り直します。
   */
  startPreviewTimer();
}
function resetAnimationPreview() {
  clearPreviewTimer();

  previewPlaying = false;
  currentPreviewFrame = 0;

  animationPreviewCanvas.width = 0;
  animationPreviewCanvas.height = 0;

  animationPreviewEmpty.hidden = false;

  previousFrameButton.disabled = true;
  playPreviewButton.disabled = true;
  stopPreviewButton.disabled = true;
  nextFrameButton.disabled = true;

  previewFrameStatus.textContent =
    "画像を読み込むとプレビューできます。";
}

function createAnimationGroupId() {
  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );
}

function getCurrentAnimationGroup() {
  return (
    animationGroups.find(
      (group) =>
        group.id === currentAnimationId
    ) ?? null
  );
}

function sanitizeAnimationName(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );
}

function addAnimationGroup() {
  const name =
    sanitizeAnimationName(
      animationNameInput.value
    );

  if (!name) {
    alert(
      "アニメーション名を入力してください。英数字・_・-が使用できます。"
    );

    return;
  }

  const alreadyExists =
    animationGroups.some(
      (group) =>
        group.name.toLowerCase() ===
        name.toLowerCase()
    );

  if (alreadyExists) {
    alert(
      "同じ名前のアニメーションがすでにあります。"
    );

    return;
  }

  const newGroup = {
    id: createAnimationGroupId(),
    name,
    frames: []
  };

  animationGroups.push(newGroup);

  animationNameInput.value = "";

  selectAnimationGroup(
    newGroup.id
  );

  markSheetAsOutdated();
}

function renderAnimationGroupList() {
  animationGroupList.innerHTML = "";

  animationGroups.forEach((group) => {
    const item =
      document.createElement("div");

    item.className =
      "animation-group-item";

    if (
      group.id === currentAnimationId
    ) {
      item.classList.add("active");
    }

    const selectButton =
      document.createElement("button");

    selectButton.type = "button";
    selectButton.className =
      "animation-group-select";

    const name =
      document.createElement("span");

    name.textContent = group.name;

    const count =
      document.createElement("span");

    count.className =
      "animation-frame-count";

    count.textContent =
      `${group.frames.length}枚`;

    selectButton.append(
      name,
      count
    );

    selectButton.addEventListener(
      "click",
      () => {
        selectAnimationGroup(
          group.id
        );
      }
    );

    const deleteButton =
      document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className =
      "animation-delete-button";

    deleteButton.textContent = "×";

    deleteButton.setAttribute(
      "aria-label",
      `${group.name}を削除`
    );

    deleteButton.addEventListener(
      "click",
      () => {
        deleteAnimationGroup(
          group.id
        );
      }
    );

    item.append(
      selectButton,
      deleteButton
    );

    animationGroupList.appendChild(
      item
    );
  });
}

function selectAnimationGroup(groupId) {
  const group =
    animationGroups.find(
      (item) =>
        item.id === groupId
    );

  if (!group) {
    return;
  }

  stopAnimationPreview();

  currentAnimationId = group.id;

  /*
   * 既存処理との互換性を保つため、
   * loadedFramesを選択中グループへ接続します。
   */
  loadedFrames = group.frames;

  imageInput.value = "";

  activeAnimationName.textContent =
    group.name;

  renderAnimationGroupList();
  showPreviews();

  if (loadedFrames.length > 0) {
    fileCount.textContent =
      `${group.name}：${loadedFrames.length}枚のPNG`;

    initializeAnimationPreview();
  } else {
    fileCount.textContent =
      `${group.name}には、まだ画像がありません。`;

    resetAnimationPreview();
  }

  updateEstimatedSize();
  updateExportButtonState();
}

function deleteAnimationGroup(groupId) {
  if (animationGroups.length <= 1) {
    alert(
      "アニメーショングループは最低1個必要です。"
    );

    return;
  }

  const group =
    animationGroups.find(
      (item) =>
        item.id === groupId
    );

  if (!group) {
    return;
  }

  const shouldDelete =
    window.confirm(
      `${group.name}を削除しますか？\n登録されている画像も一覧から外れます。`
    );

  if (!shouldDelete) {
    return;
  }

  const deletingCurrent =
    currentAnimationId === groupId;

  animationGroups =
    animationGroups.filter(
      (item) =>
        item.id !== groupId
    );

  if (deletingCurrent) {
    currentAnimationId =
      animationGroups[0].id;

    selectAnimationGroup(
      currentAnimationId
    );
  } else {
    renderAnimationGroupList();
  }

  markSheetAsOutdated();
  updateEstimatedSize();
  updateExportButtonState();
}

function getExportFrames() {
  return animationGroups.flatMap(
    (group) => {
      return group.frames.map(
        (frame, index) => {
          return {
            ...frame,

            animationName:
              group.name,

            xmlName:
              group.name +
              String(index).padStart(
                4,
                "0"
              )
          };
        }
      );
    }
  );
}

function updateExportButtonState() {
  const hasExportFrames =
    getExportFrames().length > 0;

  createSheetButton.disabled =
    !hasExportFrames;

  if (!hasExportFrames) {
    downloadButton.disabled = true;
    downloadXmlButton.disabled = true;

    generatedXml = "";
    sheetCreated = false;
  }
}

loadedFrames =
  animationGroups[0].frames;

activeAnimationName.textContent =
  animationGroups[0].name;

renderAnimationGroupList();
updateExportButtonState();

function getcurrentAnimationName() {
  return (
    animationGroups.find(
      (group) =>
        group.id === currentAnimationId
    )?.name ?? ""
  );
}

function markSheetAsOutdated() {
  sheetCreated = false;

  downloadButton.disabled = true;
  downloadXmlButton.disabled = true;

  generatedXml = "";

  createdSize.textContent =
    "内容が変更されました。スプライトシートを作成してください。";
}

function validateCanvasSize(layout) {
  const longestSide =
    Math.max(
      layout.width,
      layout.height
    );

  const pixelCount =
    layout.width * layout.height;

  if (
    longestSide > 32767 ||
    pixelCount > 268000000
  ) {
    throw new Error(
      "完成画像が大きすぎます。列数を変更するか、読み込む画像を減らしてください。"
    );
  }
}