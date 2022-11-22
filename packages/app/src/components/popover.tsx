import {
  FloatingPortal,
  Placement,
  arrow,
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
import { isNil } from "lodash";
import React from "react";

interface PopoverRenderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  props: {};
  arrowProps?: JSX.IntrinsicElements["span"];
}

export function Popover(props: {
  placement: Placement;
  reference: (renderProps: PopoverRenderProps) => React.ReactNode;
  floating: (renderProps: PopoverRenderProps) => React.ReactNode;
  onClickReference?: React.MouseEventHandler<Element>;
}) {
  const [open, setOpen] = React.useState(false);
  const arrowRef = React.useRef<HTMLElement>(null);

  const { reference, floating, context, x, y, strategy, middlewareData } =
    useFloating({
      open,
      onOpenChange: setOpen,
      placement: props.placement,
      middleware: [offset(10), flip(), shift(), arrow({ element: arrowRef })],
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
          // TODO: this arrow is only for `placement === "left"`
          arrowProps: {
            ref: arrowRef,
            style: {
              position: "absolute",
              transform: "rotate(-90deg)",
              top: !isNil(middlewareData.arrow?.y)
                ? `${middlewareData.arrow?.y}px`
                : "",
              right: "-10px",
            },
          },
        })}
      </FloatingPortal>
    </>
  );
}
