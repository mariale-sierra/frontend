import { AvatarIcon } from '../icons/avatarIcon';
import { Row } from '../layout/row';
import { Text } from '../ui/text';

export interface CreateChallengeHeaderProps {
	author: string;
}

export function CreateChallengeHeader({ author }: CreateChallengeHeaderProps) {
	return (
		<Row justify="flex-start" align="center">
			<Row justify="flex-start" align="center" gap="sm">
				<AvatarIcon size="sm" />
				<Text variant="body">By {author}</Text>
			</Row>
		</Row>
	);
}
