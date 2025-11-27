// ---------- UI MENU ----------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PipeDream')
    .addItem('Run PipeDream', 'runWorkflow')
    .addToUi();
}

// ---------- Config ----------
const WORKFLOW_URL = 'https://node-flow-mvp-bay.vercel.app';
const WORKFLOW_ID = 'd8232269-8c26-4838-b61e-b42524a62c73';
const PROMPT_COLUMN = "A"
const IMAGE_1_COLUMN = "B"
const IMAGE_2_COLUMN = "D"
const IMAGE_3_COLUMN = "F"
const OUTPUT_COLUMN = "H"
const OUTPUT_PREVIEW_COLUMN = "I"
const STARTING_ROW = 2  // Row 1 is headers, so start at 2

// ---------- Script ----------
function runWorkflow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Get the last row with data in column A
  const lastRow = sheet.getRange(`${PROMPT_COLUMN}:${PROMPT_COLUMN}`).getValues().filter(String).length;

  // If only headers exist (or sheet is empty), exit
  if (lastRow < STARTING_ROW) {
    SpreadsheetApp.getUi().alert('No data found to process.');
    return;
  }

  // Get all input values at once
  const promptRange = sheet.getRange(`${PROMPT_COLUMN}${STARTING_ROW}:${PROMPT_COLUMN}${lastRow}`);
  const promptValues = promptRange.getValues();

  const image1Range = sheet.getRange(`${IMAGE_1_COLUMN}${STARTING_ROW}:${IMAGE_1_COLUMN}${lastRow}`);
  const image1Values = image1Range.getValues();

  const image2Range = sheet.getRange(`${IMAGE_2_COLUMN}${STARTING_ROW}:${IMAGE_2_COLUMN}${lastRow}`);
  const image2Values = image2Range.getValues();

  const image3Range = sheet.getRange(`${IMAGE_3_COLUMN}${STARTING_ROW}:${IMAGE_3_COLUMN}${lastRow}`);
  const image3Values = image3Range.getValues();

  // Show loading state for all rows
  const loadingValues = promptValues.map(() => ["Loading..."]);

  const outputRange = sheet.getRange(`${OUTPUT_COLUMN}${STARTING_ROW}:${OUTPUT_COLUMN}${lastRow}`);
  outputRange.setValues(loadingValues);

  const previewRange = sheet.getRange(`${OUTPUT_PREVIEW_COLUMN}${STARTING_ROW}:${OUTPUT_PREVIEW_COLUMN}${lastRow}`);
  previewRange.setValues(loadingValues);

  // Build array of requests
  const url = `${WORKFLOW_URL}/api/workflows/${WORKFLOW_ID}/run`;
  const requests = promptValues.map(([promptValue], index) => {
    const image1Value = image1Values[index][0];
    const image2Value = image2Values[index][0];
    const image3Value = image3Values[index][0];

    // Build inputs object, only including non-empty image values
    const inputs = {
      'prompt': promptValue || 'Show a default error graphic.'
    };

    if (image1Value) inputs.image_1 = image1Value;
    if (image2Value) inputs.image_2 = image2Value;
    if (image3Value) inputs.image_3 = image3Value;

    return {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify({ inputs }),
      'muteHttpExceptions': true  // Don't throw on HTTP errors
    };
  });

  // Build array of URLs (same URL for all requests)
  const urls = promptValues.map(() => url);

  try {
    // Fetch all requests in parallel
    const responses = UrlFetchApp.fetchAll(urls.map((u, i) => {
      return {
        url: u,
        ...requests[i]
      };
    }));

    // Process all responses
    const outputValues = [];
    const previewValues = [];

    responses.forEach((response, index) => {
      const row = STARTING_ROW + index;

      try {
        const data = JSON.parse(response.getContentText());

        if (data.status === 'completed' && data.outputs) {
          const output = data.outputs.result;

          if (output && output.value !== undefined) {
            // Save output value
            outputValues.push([output.value]);

            // Determine preview cell content
            let previewFormula;
            if (output.type === 'image') {
              previewFormula = `=IMAGE(${OUTPUT_COLUMN}${row},1)`;
            } else if (output.type === 'video') {
              previewFormula = `=HYPERLINK("${output.value}", "▶️ Click to watch video")`;
            } else {
              // Fallback: check URL extension
              if (typeof output.value === 'string' && output.value.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                previewFormula = `=IMAGE(${OUTPUT_COLUMN}${row},1)`;
              } else if (typeof output.value === 'string' && output.value.match(/\.(mp4|mov|avi|webm)$/i)) {
                previewFormula = `=HYPERLINK("${output.value}", "▶️ Click to watch video")`;
              } else {
                previewFormula = "Not an image/video";
              }
            }
            previewValues.push([previewFormula]);
          } else {
            outputValues.push(['']);
            previewValues.push(['']);
          }
        } else if (data.error) {
          outputValues.push([`Error: ${data.error.message}`]);
          previewValues.push([`Error: ${data.error.message}`]);
        } else {
          outputValues.push(['']);
          previewValues.push(['']);
        }
      } catch (error) {
        outputValues.push([`Error: ${error.message}`]);
        previewValues.push([`Error: ${error.message}`]);
      }
    });

    // Write all outputs at once
    sheet.getRange(`${OUTPUT_COLUMN}${STARTING_ROW}:${OUTPUT_COLUMN}${lastRow}`).setValues(outputValues);

    // Write all preview formulas at once
    const previewRange = sheet.getRange(`${OUTPUT_PREVIEW_COLUMN}${STARTING_ROW}:${OUTPUT_PREVIEW_COLUMN}${lastRow}`);
    previewValues.forEach((value, index) => {
      const cell = sheet.getRange(`${OUTPUT_PREVIEW_COLUMN}${STARTING_ROW + index}`);
      if (value[0].startsWith('=')) {
        cell.setFormula(value[0]);
      } else {
        cell.setValue(value[0]);
      }
    });

    SpreadsheetApp.getUi().alert(`Processed ${lastRow - STARTING_ROW + 1} rows in parallel.`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Fatal error: ${error.message}`);

    // Clear loading states on error
    const errorRange = sheet.getRange(`${OUTPUT_COLUMN}${STARTING_ROW}:${OUTPUT_COLUMN}${lastRow}`);
    const errorValues = promptValues.map(() => [`Error: ${error.message}`]);
    errorRange.setValues(errorValues);
  }
}
