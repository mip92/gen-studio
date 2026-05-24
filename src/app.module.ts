import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { CharactersModule } from './characters/characters.module';
import { ScenesModule } from './scenes/scenes.module';
import { ShotsModule } from './shots/shots.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ReferenceAssetsModule } from './reference-assets/reference-assets.module';
import { ComfyModule } from './comfy/comfy.module';
import { GenerationModule } from './generation/generation.module';
import { TrainingModule } from './training/training.module';
import { TTSModule } from './tts/tts.module';
import { BgmModule } from './bgm/bgm.module';
import { ExportsModule } from './exports/exports.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { ActionsModule } from './actions/actions.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProjectsModule,
    CharactersModule,
    ScenesModule,
    ShotsModule,
    WorkflowModule,
    ReferenceAssetsModule,
    ComfyModule,
    GenerationModule,
    TrainingModule,
    TTSModule,
    BgmModule,
    ExportsModule,
    PipelineModule,
    ActionsModule,
    LocationsModule,
  ],
})
export class AppModule {}
