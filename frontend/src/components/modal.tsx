import { ReactNode, useEffect } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	footer?: ReactNode;
	size?: ModalSize;
	closeOnOverlayClick?: boolean;
	showCloseButton?: boolean;
	className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
	sm: "max-w-md",
	md: "max-w-lg",
	lg: "max-w-2xl",
	xl: "max-w-4xl",
	full: "max-w-6xl",
};

export default function Modal({
	isOpen,
	onClose,
	title,
	children,
	footer,
	size = "md",
	closeOnOverlayClick = true,
	showCloseButton = true,
	className = "",
}: ModalProps) {
	useEffect(() => {
		if (!isOpen) return;

		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		document.addEventListener("keydown", handleEsc);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleEsc);
			document.body.style.overflow = prevOverflow;
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			onClick={() => {
				if (closeOnOverlayClick) onClose();
			}}
		>
			<div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

			<div
				className={`relative z-10 w-full ${sizeClasses[size]} rounded-xl border border-slate-200 bg-white shadow-2xl ${className}`}
				onClick={(e) => e.stopPropagation()}
			>
				{(title || showCloseButton) && (
					<div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
						<h2 className="text-base font-semibold text-slate-800">{title}</h2>

						{showCloseButton && (
							<button
								type="button"
								onClick={onClose}
								aria-label="Close modal"
								className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="h-5 w-5"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						)}
					</div>
				)}

				<div className="max-h-[75vh] overflow-y-auto px-5 py-4 text-slate-700">
					{children}
				</div>

				{footer && (
					<div className="border-t border-slate-200 px-5 py-4">{footer}</div>
				)}
			</div>
		</div>
	);
}
