import {
  pipeline,
  type ZeroShotClassificationPipeline,
} from "@huggingface/transformers";

const MODEL = "onnx-community/multilingual-MiniLMv2-L6-mnli-xnli-ONNX";

let classifier: Promise<ZeroShotClassificationPipeline> | undefined;

export function loadBert() {
  classifier ??= pipeline("zero-shot-classification", MODEL, { dtype: "q8" });
  return classifier;
}
