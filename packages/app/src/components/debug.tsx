export function Debug(props: { data: any } & JSX.IntrinsicElements["details"]) {
  const { data, ...rest } = props;
  return (
    <details {...rest}>
      <summary onClick={() => console.log("debug", data)}>debug</summary>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}
