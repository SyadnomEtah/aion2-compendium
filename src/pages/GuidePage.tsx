import { useParams } from 'react-router-dom';
import { GuideBody } from '../components/GuideBody';

/** Renders any guide page (Start Here, Priorities, Systems, class pages, Sources, ...) from its fetched PageData. */
export function GuidePage() {
  const { pageId } = useParams<{ pageId: string }>();
  return <GuideBody pageId={pageId ?? 'home'} />;
}
