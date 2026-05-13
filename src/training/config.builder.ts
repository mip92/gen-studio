import * as path from 'path';

export interface TrainingConfigInput {
  datasetDir:     string;   // absolute path to <root>/img
  outputDir:      string;
  outputName:     string;
  baseModelPath:  string;
  triggerToken:   string;
  resolution?:    number;
  numRepeats?:    number;
  maxTrainSteps?: number;
  networkDim?:    number;
  networkAlpha?:  number;
  learningRate?:  number;
  batchSize?:     number;
}

export interface BuiltConfig {
  datasetTomlPath: string;
  datasetTomlBody: string;
  trainArgs:       string[];
}

/** Defaults tuned for SDXL character LoRA training on 12-24 GB VRAM. */
const DEFAULTS = {
  resolution:    1024,
  numRepeats:    10,
  maxTrainSteps: 3000,
  networkDim:    32,
  networkAlpha:  32,
  learningRate:  1e-4,
  batchSize:     1,
};

export function buildKohyaConfig(input: TrainingConfigInput): BuiltConfig {
  const cfg = { ...DEFAULTS, ...input };

  // kohya expects subset folder named "<num_repeats>_<token>"
  const subsetDir = path.join(cfg.datasetDir, `${cfg.numRepeats}_${cfg.triggerToken}`);

  // shuffle_caption/keep_tokens intentionally NOT set — kohya forbids them
  // alongside --cache_text_encoder_outputs (SDXL caches per-caption tensors
  // once and reuses them, which is incompatible with caption shuffling).
  const datasetTomlBody = [
    `[general]`,
    `caption_extension = ".txt"`,
    ``,
    `[[datasets]]`,
    `resolution = ${cfg.resolution}`,
    `batch_size = ${cfg.batchSize}`,
    `enable_bucket = true`,
    `bucket_no_upscale = true`,
    `bucket_reso_steps = 64`,
    ``,
    `  [[datasets.subsets]]`,
    `  image_dir   = ${tomlString(subsetDir)}`,
    `  num_repeats = ${cfg.numRepeats}`,
    ``,
  ].join('\n');

  const datasetTomlPath = path.join(path.dirname(cfg.datasetDir), 'dataset.toml');

  const trainArgs = [
    `--pretrained_model_name_or_path=${cfg.baseModelPath}`,
    `--dataset_config=${datasetTomlPath}`,
    `--output_dir=${cfg.outputDir}`,
    `--output_name=${cfg.outputName}`,
    `--save_model_as=safetensors`,
    `--network_module=networks.lora`,
    `--network_dim=${cfg.networkDim}`,
    `--network_alpha=${cfg.networkAlpha}`,
    `--learning_rate=${cfg.learningRate}`,
    `--unet_lr=${cfg.learningRate}`,
    `--max_train_steps=${cfg.maxTrainSteps}`,
    `--train_batch_size=${cfg.batchSize}`,
    `--max_token_length=225`,
    `--mixed_precision=fp16`,
    `--save_precision=fp16`,
    `--optimizer_type=AdamW8bit`,
    `--sdpa`,
    `--cache_latents`,
    `--cache_latents_to_disk`,
    `--cache_text_encoder_outputs`,
    `--cache_text_encoder_outputs_to_disk`,
    `--network_train_unet_only`,
    `--no_half_vae`,
    `--gradient_checkpointing`,
    `--lr_scheduler=cosine`,
    `--lr_warmup_steps=50`,
    `--min_snr_gamma=5`,
    `--noise_offset=0.05`,
    `--save_every_n_epochs=1`,
    `--max_data_loader_n_workers=2`,
    `--persistent_data_loader_workers`,
    `--seed=42`,
    `--logging_dir=${path.join(cfg.outputDir, 'logs')}`,
  ];

  return { datasetTomlPath, datasetTomlBody, trainArgs };
}

function tomlString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
