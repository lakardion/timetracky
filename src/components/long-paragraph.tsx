import { FC, ReactNode, useMemo, useState } from "react";

const LongParagraph: FC<{ charLimit: number; children: string }> = ({
  charLimit,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const [first, second] = useMemo(() => {
    if (children.length > charLimit) {
      return [
        children.substring(0, charLimit) + "...",
        children.substring(charLimit),
      ];
    }
    return [children, null];
  }, [charLimit, children]);

  const handleToggleExpand = () => {
    setIsExpanded((ie) => !ie);
  };

  if (!second) return <p className="text-sm">{first}</p>;
  return (
    <>
      <p className="text-sm max-h-48 overflow-auto">
        {first} {isExpanded ? second : null}
      </p>
      {!isExpanded ? (
        <p
          className="text-blue-600 hover:underline hover:cursor-pointer"
          onClick={handleToggleExpand}
        >
          more
        </p>
      ) : (
        <p
          onClick={handleToggleExpand}
          className="text-blue-600 hover:underline hover:cursor-pointer"
        >
          less
        </p>
      )}
    </>
  );
};
export default LongParagraph;
