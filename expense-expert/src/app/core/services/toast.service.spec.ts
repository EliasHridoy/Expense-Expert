import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty list of toasts', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should show a toast and default to info type', fakeAsync(() => {
    spyOn(crypto, 'randomUUID').and.returnValue('12345678-1234-1234-1234-123456789012');
    service.show('Test message');

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0]).toEqual({
      id: '12345678-1234-1234-1234-123456789012',
      message: 'Test message',
      type: 'info'
    });

    tick(4000);
    expect(service.toasts().length).toBe(0);
  }));

  it('should show a success toast', () => {
    spyOn(service, 'show');
    service.success('Success message');
    expect(service.show).toHaveBeenCalledWith('Success message', 'success');
  });

  it('should show an error toast', () => {
    spyOn(service, 'show');
    service.error('Error message');
    expect(service.show).toHaveBeenCalledWith('Error message', 'error');
  });

  it('should show an info toast', () => {
    spyOn(service, 'show');
    service.info('Info message');
    expect(service.show).toHaveBeenCalledWith('Info message', 'info');
  });

  it('should dismiss a toast by id', () => {
    spyOn(crypto, 'randomUUID').and.returnValue('12345678-1234-1234-1234-123456789012');
    service.show('Test message');
    expect(service.toasts().length).toBe(1);

    service.dismiss('12345678-1234-1234-1234-123456789012');
    expect(service.toasts().length).toBe(0);
  });
});
