import {
  FloatingPortal,
  useDismiss,
  useFloating,
  useId,
  useInteractions,
} from "@floating-ui/react-dom-interactions";
import { Transition } from "@headlessui/react";
import { tinyassert } from "@hiogawa/utils";
import type React from "react";
import { RemoveScroll } from "react-remove-scroll";

export function Drawer(props: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { floating, context } = useFloating({
    open: props.open,
    onOpenChange: (open) => {
      tinyassert(!open); // should get only `open = false` via `useDismiss`
      props.onClose();
    },
  });
  const { getFloatingProps } = useInteractions([useDismiss(context)]);
  const id = useId();

  return (
    <FloatingPortal id={id}>
      <Transition show={props.open} className="fixed z-100">
        {/* backdrop */}
        <Transition.Child
          className="transition duration-300 fixed inset-0 bg-black"
          enterFrom="opacity-0"
          enterTo="opacity-40"
          leaveFrom="opacity-40"
          leaveTo="opacity-0"
        />
        {/* content */}
        <RemoveScroll className="fixed inset-0 overflow-hidden">
          <Transition.Child
            // requires absolute width
            className="transition duration-300 transform w-[200px] h-full bg-colorBgContainer shadow-lg"
            enterFrom="translate-x-[-100%]"
            enterTo="translate-x-[0]"
            leaveFrom="translate-x-[0]"
            leaveTo="translate-x-[-100%]"
          >
            <div
              {...getFloatingProps({
                ref: floating,
                className: "w-full h-full",
              })}
            >
              {props.children}
            </div>
          </Transition.Child>
        </RemoveScroll>
      </Transition>
    </FloatingPortal>
  );
}
