import { Command } from '#core/commands';
import { Event } from '#core/events';
import { NO_EVENTS_FOUND, STREAM_NOT_FOUND } from '#core/eventStore/reading';
import {
  Result,
  success,
  getCurrentTime,
  getNumberRanges,
} from '#core/primitives';
import { getArchivisationForStreamName } from '..';

export type ArchiveStream = Command<
  'archive-stream',
  {
    streamName: string;
    archiveBeforeRevision: bigint;
  }
>;

export type CopyingStreamFromStreamScheduled = Event<
  'stream-batch-archivisation-scheduled',
  {
    streamName: string;
    fromRevision: string;
    beforeRevision: string;
    scheduledAt: Date;
  }
>;

export async function handleArchiveStream(
  getStreamRevisionOfTheFirstEvent: (
    streamName: string
  ) => Promise<Result<bigint, STREAM_NOT_FOUND | NO_EVENTS_FOUND>>,
  command: ArchiveStream
): Promise<
  Result<CopyingStreamFromStreamScheduled[], STREAM_NOT_FOUND | NO_EVENTS_FOUND>
> {
  const { streamName, archiveBeforeRevision } = command.data;

  const toStreamName = getArchivisationForStreamName(streamName);

  const fromRevision = await getStreamRevisionOfTheFirstEvent(streamName);

  if (fromRevision.isError) return fromRevision;

  const events: CopyingStreamFromStreamScheduled[] = getNumberRanges(
    fromRevision.value,
    archiveBeforeRevision
  ).map(({ from, to }) => {
    return {
      type: 'stream-batch-archivisation-scheduled',
      data: {
        streamName,
        toStreamName,
        fromRevision: from.toString(),
        beforeRevision: to.toString(),
        scheduledAt: getCurrentTime(),
      },
    };
  });

  return success(events);
}
