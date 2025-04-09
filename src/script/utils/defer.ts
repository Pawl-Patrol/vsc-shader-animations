export function deferrable<T = void>() {
  let value: T;

  let resolve: () => void;
  const promise = new Promise<void>((res) => (resolve = res));

  const setValue = (v: T) => {
    value = v;
    resolve();
  };

  const getValue = () => {
    return value!;
  };

  const wait = async () => {
    await promise;
  };

  return { setValue, getValue, wait };
}
