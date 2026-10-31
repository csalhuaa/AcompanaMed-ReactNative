import { useRef } from 'react';
import { ScrollView, Platform } from 'react-native';

export interface UseHorizontalScrollReturn {
  scrollRef: React.RefObject<ScrollView | null>;
  scrollBy: (offset: number) => void;
  webHandlers: Record<string, any>;
  isDragging: React.MutableRefObject<boolean>;
}

/**
 * Hook para listas horizontales y carruseles con soporte completo multiplataforma:
 * - Web: arrastre suave con ratón (drag to scroll), desplazamiento con rueda (mouse wheel) y botones chevrons.
 * - Nativo (iOS/Android): desplazamiento táctil nativo sin interferencias.
 */
export function useHorizontalScroll(): UseHorizontalScrollReturn {
  const scrollRef = useRef<ScrollView | null>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);
  const isDragging = useRef(false);

  const scrollBy = (offset: number) => {
    if (!scrollRef.current) return;
    const node: any = (scrollRef.current as any).getScrollableNode?.() || scrollRef.current;
    if (node && typeof node.scrollBy === 'function') {
      node.scrollBy({ left: offset, behavior: 'smooth' });
    } else if (typeof (scrollRef.current as any).scrollTo === 'function') {
      (scrollRef.current as any).scrollTo({ x: (node?.scrollLeft || 0) + offset, animated: true });
    }
  };

  const webHandlers = Platform.OS === 'web' ? {
    onWheel: (e: any) => {
      if (e.deltaY !== 0) {
        e.currentTarget.scrollLeft += e.deltaY;
      }
    },
    onMouseDown: (e: any) => {
      isDown.current = true;
      isDragging.current = false;
      startX.current = e.pageX - e.currentTarget.offsetLeft;
      scrollLeftPos.current = e.currentTarget.scrollLeft;
      e.currentTarget.style.cursor = 'grabbing';
      e.currentTarget.style.userSelect = 'none';
    },
    onMouseLeave: (e: any) => {
      isDown.current = false;
      e.currentTarget.style.cursor = 'grab';
    },
    onMouseUp: (e: any) => {
      isDown.current = false;
      e.currentTarget.style.cursor = 'grab';
    },
    onMouseMove: (e: any) => {
      if (!isDown.current) return;
      e.preventDefault();
      const x = e.pageX - e.currentTarget.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      if (Math.abs(walk) > 5) {
        isDragging.current = true;
      }
      e.currentTarget.scrollLeft = scrollLeftPos.current - walk;
    },
  } : {};

  return { scrollRef, scrollBy, webHandlers, isDragging };
}
