import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { CharactersModule } from './characters/characters.module';
import { ScenesModule } from './scenes/scenes.module';
import { ShotsModule } from './shots/shots.module';
import { ReferenceAssetsModule } from './reference-assets/reference-assets.module';
import { ComfyModule } from './comfy/comfy.module';
import { GenerationModule } from './generation/generation.module';
import { TrainingModule } from './training/training.module';
import { TTSModule } from './tts/tts.module';
import { VoiceoversModule } from './voiceovers/voiceovers.module';
import { BgmModule } from './bgm/bgm.module';
import { ExportsModule } from './exports/exports.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { QueueLedgerModule } from './pipeline/queue-ledger.module';
import { ActionsModule } from './actions/actions.module';
import { LocationsModule } from './locations/locations.module';
import { PropsModule } from './props/props.module';
import { YoutubeModule } from './youtube/youtube.module';
import { ThumbnailsModule } from './thumbnails/thumbnails.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { ComicModule } from './comic/comic.module';
import { ReleasesModule } from './releases/releases.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // Global: the queue/ledger is reached by every job service, the delete paths
    // and the stats endpoint. Registered here so it exists regardless of which
    // feature module happens to load first.
    QueueLedgerModule,
    ProjectsModule,
    CharactersModule,
    ScenesModule,
    ShotsModule,
    ReferenceAssetsModule,
    ComfyModule,
    GenerationModule,
    TrainingModule,
    TTSModule,
    VoiceoversModule,
    BgmModule,
    ExportsModule,
    PipelineModule,
    ActionsModule,
    LocationsModule,
    PropsModule,
    YoutubeModule,
    ThumbnailsModule,
    TelegramBotModule,
    ComicModule,
    ReleasesModule,
  ],
})
export class AppModule {}
