import Swal from 'sweetalert2';

export const showDeleteConfirmation = async (
  title: string = 'Are you sure?',
  text: string = 'You won\'t be able to revert this!',
  confirmButtonText: string = 'Yes, delete it!'
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText,
    cancelButtonText: 'Cancel'
  });

  return result.isConfirmed;
};
export const showConfirmation = async (
  title: string ,
  text: string ,
  confirmButtonText: string 
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText,
    cancelButtonText: "Cancel",
  });

  return result.isConfirmed;
};

export const showSuccessAlert = (
  title: string = 'Success!',
  text: string = 'Operation completed successfully.',
  timer: number = 2000
) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    timer,
    showConfirmButton: false
  });
};

export const showErrorAlert = (
  title: string = 'Error!',
  text: string = 'Something went wrong.',
) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK'
  });
};