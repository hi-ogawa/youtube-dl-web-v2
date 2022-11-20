import {
  FloatingPortal,
  Placement,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useId,
  useInteractions,
} from "@floating-ui/react-dom-interactions";
import React from "react";

interface PopoverRenderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  props: {};
}

export function Popover(props: {
  placement: Placement;
  reference: (renderProps: PopoverRenderProps) => React.ReactNode;
  floating: (renderProps: PopoverRenderProps) => React.ReactNode;
  onClickReference?: React.MouseEventHandler<Element>;
}) {
  const [open, setOpen] = React.useState(false);

  const { reference, floating, context, x, y, strategy } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: props.placement,
    middleware: [offset(5), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
  ]);

  const id = useId();

  return (
    <>
      {props.reference({
        open,
        setOpen,
        props: getReferenceProps({
          ref: reference,
          onClick: props.onClickReference,
        }),
      })}
      <FloatingPortal id={id}>
        {props.floating({
          open,
          setOpen,
          props: getFloatingProps({
            ref: floating,
            style: {
              top: y ?? "",
              left: x ?? "",
              position: strategy,
            },
          }),
        })}
      </FloatingPortal>
    </>
  );
}
