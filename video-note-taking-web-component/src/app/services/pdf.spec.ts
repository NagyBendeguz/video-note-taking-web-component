import { TestBed } from '@angular/core/testing';
import { PdfService } from './pdf';

describe('PdfService', () =>
{
  let service: PdfService;

  let mockDoc: any;

  beforeEach(() =>
  {
    mockDoc =
    {
      internal:
      {
        pageSize:
        {
          getWidth: jasmine.createSpy().and.returnValue(210),
          getHeight: jasmine.createSpy().and.returnValue(297)
        }
      },

      addPage: jasmine.createSpy('addPage'),
      addImage: jasmine.createSpy('addImage'),
      splitTextToSize: jasmine.createSpy('splitTextToSize').and.callFake((text: string) =>
      {
        return [text];
      }),
      setFontSize: jasmine.createSpy('setFontSize'),
      text: jasmine.createSpy('text'),
      save: jasmine.createSpy('save'),
      getFontSize: jasmine.createSpy('getFontSize').and.returnValue(14)
    };

    TestBed.configureTestingModule({});

    service = TestBed.inject(PdfService);
  });

  it('should be created', () =>
  {
    expect(service).toBeTruthy();
  });

  it('should calculate text height correctly', () =>
  {
    const result = (service as any).getTextHeight(
      mockDoc,
      'Sample text',
      100
    );

    expect(result).toBeCloseTo(20.1, 1);
  });

  it('should calculate larger height for multiple lines', () =>
  {
    mockDoc.splitTextToSize.and.returnValue([
      'line1',
      'line2',
      'line3'
    ]);

    const result = (service as any).getTextHeight(
      mockDoc,
      'Long text',
      100
    );

    expect(result).toBeCloseTo(52.3, 1);
  });
});