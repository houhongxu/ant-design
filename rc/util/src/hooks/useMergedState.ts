import useEvent from './useEvent';
import { useLayoutUpdateEffect } from './useLayoutEffect';
import useState from './useState';

type Updater<T> = (
  updater: T | ((origin: T) => T),
  ignoreDestroy?: boolean,
) => void;

/** We only think `undefined` is empty */
function hasValue(value: any) {
  return value !== undefined;
}

/**
 * Similar to `useState` but will use props value if provided.
 * Note that internal use rc-util `useState` hook.
 */
export default function useMergedState<T, R = T>(
  defaultStateValue: T | (() => T),
  option?: {
    defaultValue?: T | (() => T);
    value?: T;
    onChange?: (value: T, prevValue: T) => void;
    postState?: (value: T) => T;
  },
): [R, Updater<T>] {
  //// 目前只传入了defaultValue和value，defaultValue也先作为undefined考虑
  const { defaultValue, value, onChange, postState } = option || {};

  // ======================= Init =======================
  //// ! 根据value??defaultValue??defaultStateValue来初始化innerValue
  const [innerValue, setInnerValue] = useState<T>(() => {
    if (hasValue(value)) {
      return value;
    } else if (hasValue(defaultValue)) {
      return typeof defaultValue === 'function'
        ? (defaultValue as any)()
        : defaultValue;
    } else {
      return typeof defaultStateValue === 'function'
        ? (defaultStateValue as any)()
        : defaultStateValue;
    }
  });

  //// ! 如果外部value有值，则使用外部value，否则使用innerValue
  const mergedValue = value !== undefined ? value : innerValue;
  //// 目前不用
  const postMergedValue = postState ? postState(mergedValue) : mergedValue;

  // ====================== Change ======================
  //// 目前不用onChangeFn
  const onChangeFn = useEvent(onChange);

  const [prevValue, setPrevValue] = useState<[T]>([mergedValue]);

  useLayoutUpdateEffect(() => {
    const prev = prevValue[0];
    if (innerValue !== prev) {
      onChangeFn(innerValue, prev);
    }
  }, [prevValue]);

  // Sync value back to `undefined` when it from control to un-control
  useLayoutUpdateEffect(() => {
    if (!hasValue(value)) {
      setInnerValue(value);
    }
  }, [value]);

  // ====================== Update ======================
  const triggerChange: Updater<T> = useEvent((updater, ignoreDestroy) => {
    //// ! 就是触发内部innerValue更新
    setInnerValue(updater, ignoreDestroy);
    setPrevValue([mergedValue], ignoreDestroy);
  });

  return [postMergedValue as unknown as R, triggerChange];
}
