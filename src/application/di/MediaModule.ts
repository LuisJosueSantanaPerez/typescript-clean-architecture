import { Module } from '@nestjs/common';
import { Connection } from 'typeorm';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { MediaDITokens } from '@core/domain/media/di/MediaDITokens';
import { CreateMediaService } from '@core/service/media/usecase/CreateMediaService';
import { EditMediaService } from '@core/service/media/usecase/EditMediaService';
import { GetMediaListService } from '@core/service/media/usecase/GetMediaListService';
import { GetMediaService } from '@core/service/media/usecase/GetMediaService';
import { RemoveMediaService } from '@core/service/media/usecase/RemoveMediaService';
import { CoreDITokens } from '@core/common/di/CoreDITokens';
import { HandleDoesMediaExistQueryService } from '@core/service/media/handler/HandleDoesMediaExistQueryService';
import { HandleGetMediaPreviewQueryService } from '@core/service/media/handler/HandleGetMediaPreviewQueryService';
import { MinioMediaFileStorageAdapter } from '@infrastructure/adapter/persistence/media-file/MinioMediaFileStorageAdapter';
import { TypeOrmMediaRepositoryAdapter } from '@infrastructure/adapter/persistence/typeorm/repository/media/TypeOrmMediaRepositoryAdapter';
import { NestWrapperDoesMediaExistQueryHandler } from '@infrastructure/handler/media/NestWrapperDoesMediaExistQueryHandler';
import { NestWrapperGetMediaPreviewQueryHandler } from '@infrastructure/handler/media/NestWrapperGetMediaPreviewQueryHandler';
import { MediaController } from '@application/api/http-rest/controller/MediaController';

const persistenceProviders: Provider[] = [
  {
    provide : MediaDITokens.MediaFileStorage,
    useClass: MinioMediaFileStorageAdapter,
  },
  {
    provide   : MediaDITokens.MediaRepository,
    useFactory: connection => connection.getCustomRepository(TypeOrmMediaRepositoryAdapter),
    inject    : [Connection]
  }
];

const useCaseProviders: Provider[] = [
  {
    provide   : MediaDITokens.CreateMediaUseCase,
    useFactory: (mediaRepository, mediaFileStorage) => new CreateMediaService(mediaRepository, mediaFileStorage),
    inject    : [MediaDITokens.MediaRepository, MediaDITokens.MediaFileStorage]
  },
  {
    provide   : MediaDITokens.EditMediaUseCase,
    useFactory: (mediaRepository) => new EditMediaService(mediaRepository),
    inject    : [MediaDITokens.MediaRepository]
  },
  {
    provide   : MediaDITokens.GetMediaListUseCase,
    useFactory: (mediaRepository) => new GetMediaListService(mediaRepository),
    inject    : [MediaDITokens.MediaRepository]
  },
  {
    provide   : MediaDITokens.GetMediaUseCase,
    useFactory: (mediaRepository) => new GetMediaService(mediaRepository),
    inject    : [MediaDITokens.MediaRepository]
  },
  {
    provide   : MediaDITokens.RemoveMediaUseCase,
    useFactory: (mediaRepository, eventBus) => new RemoveMediaService(mediaRepository, eventBus),
    inject    : [MediaDITokens.MediaRepository, CoreDITokens.EventBus]
  },
];

const handlerProviders: Provider[] = [
  NestWrapperDoesMediaExistQueryHandler,
  NestWrapperGetMediaPreviewQueryHandler,
  {
    provide   : MediaDITokens.DoesMediaExistQueryHandler,
    useFactory: (mediaRepository) => new HandleDoesMediaExistQueryService(mediaRepository),
    inject    : [MediaDITokens.MediaRepository]
  },
  {
    provide   : MediaDITokens.GetMediaPreviewQueryHandler,
    useFactory: (mediaRepository) => new HandleGetMediaPreviewQueryService(mediaRepository),
    inject    : [MediaDITokens.MediaRepository]
  }
];

@Module({
  controllers: [
    MediaController
  ],
  providers: [
    ...persistenceProviders,
    ...useCaseProviders,
    ...handlerProviders,
  ]
})
export class MediaModule {}
