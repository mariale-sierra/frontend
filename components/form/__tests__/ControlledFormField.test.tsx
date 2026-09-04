import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { ControlledFormField } from '../ControlledFormField';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
});
type Values = z.infer<typeof schema>;

describe('ControlledFormField', () => {
  it('shows the zod error inline after an invalid submit, and clears it once corrected', async () => {
    const onValid = jest.fn();
    let submit = () => Promise.resolve();

    function Harness() {
      const { control, handleSubmit } = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { title: '' },
      });
      submit = handleSubmit(onValid);
      return (
        <ControlledFormField control={control} name="title" label="Title" placeholder="Enter a title" />
      );
    }

    const screen = await renderWithTheme(<Harness />);

    expect(screen.queryByText('Title is required')).toBeNull();

    await submit();
    expect(await screen.findByText('Title is required')).toBeTruthy();
    expect(onValid).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByPlaceholderText('Enter a title'), 'A real title');
    await submit();
    expect(onValid.mock.calls[0][0]).toEqual({ title: 'A real title' });
    expect(screen.queryByText('Title is required')).toBeNull();
  });
});
