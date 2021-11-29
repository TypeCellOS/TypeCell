import { useCallback, useState } from 'react';

import { css, jsx } from '@emotion/core';

import Button from '@atlaskit/button/standard-button';

import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ModalTransition,
} from '@atlaskit/modal-dialog';

const boldStyles = css({
	fontWeight: 'bold',
});

export default function Example() {
	const [isOpen, setIsOpen] = useState(true);
	const openModal = useCallback(() => setIsOpen(true), []);
	const closeModal = useCallback(() => setIsOpen(false), []);

	return (
		<ModalTransition>
			{isOpen && (
				<Modal onClose={closeModal}>
					<ModalHeader>
						<ModalTitle>Duplicate this page</ModalTitle>
					</ModalHeader>
					<ModalBody>
						Duplicating this page will make it a child page of{' '}
						<span css={boldStyles}>Search - user exploration</span>, in the{' '}
						<span css={boldStyles}>Search & Smarts</span> space.
					</ModalBody>
					<ModalFooter>
						<Button appearance="subtle">Cancel</Button>
						<Button appearance="primary" onClick={closeModal} autoFocus>
							Duplicate
						</Button>
					</ModalFooter>
				</Modal>
			)}
		</ModalTransition>
	);
}