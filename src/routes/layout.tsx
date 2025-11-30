import { component$, Slot } from "@qwik.dev/core";
import { DevBar } from "~/components/DevBar";

export default component$(() => {
  return (
    <>
      <Slot />
      {/* {import.meta.env.DEV && <DevBar />} */}
      <DevBar />
    </>
  );
});
